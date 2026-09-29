import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { seedLiveClub, sql } from "./helpers";

const SHOTS = path.join(__dirname, "screenshots");
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// The shape the prototype's inbox exported, so the pilot club's file maps without help.
const CSV = [
  '"Player name","Age","Date of birth","Gender","Uniform size","School","Experience","Parent name","Relationship","Parent mobile","Parent email","Emergency contact","Emergency phone","Medical","Ambulance cover","Consent - medical","Consent - conduct","Consent - photos","Notes","How did you hear","Registered"',
  '"Ali Import","11","04/05/2015","Boy","Youth M","Example Primary","Brand new","Sana Import","Mother","0400 111 222","sana@import.example","Omar Import","0400 111 223","None","Yes","Yes","Yes","Yes","","Instagram","2026-09-20T03:00:00Z"',
  '"Layla Import","13","2013-08-19","Girl","Youth L","Example High","Played a season or two","Sana Import","Mother","0400 111 222","sana@import.example","Omar Import","0400 111 223","Asthma","Yes","Yes","Yes","No","Wants to play with Ali","Word of mouth","20 Sep 2026"',
  '"Broken Row","","not a date","Boy","","","","","","","","","","","","","","","","",""',
  '"Ali Import","11","4 May 2015","Boy","Youth M","Example Primary","Brand new","Sana Import","Mother","0400 111 222","sana@import.example","","","None","","Yes","Yes","Yes","","","2026-09-21T03:00:00Z"',
].join("\r\n");

test("a spreadsheet in the prototype's shape imports with the right mapping, dupes and audit", async ({ page }, testInfo) => {
  const stamp = Date.now().toString(36);
  const { slug, clubId } = await seedLiveClub(stamp);
  const email = `import-admin-${stamp}@e2e.test`;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: u } = await admin.auth.admin.createUser({ email, password: "Passw0rd!e2e", email_confirm: true });
  await sql("insert into public.club_users (club_id, user_id, role) values ($1, $2, 'admin')", [clubId, u!.user.id]);

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Passw0rd!e2e");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${slug}`));
  await page.goto(`/app/${slug}/members/import`);

  await page.locator('input[type="file"]').setInputFiles({ name: "sonics-registrations.csv", mimeType: "text/csv", buffer: Buffer.from(CSV, "utf8") });
  await expect(page.getByRole("heading", { name: "Match the columns" })).toBeVisible();
  // auto-mapping from the prototype's headers
  await expect(page.locator("label", { hasText: "Player full name" }).locator("select")).toHaveValue("Player name");
  await expect(page.locator("label", { hasText: "Date of birth" }).locator("select")).toHaveValue("Date of birth");
  await expect(page.locator("label", { hasText: "Parent email" }).locator("select")).toHaveValue("Parent email");
  await expect(page.locator("label", { hasText: "Consent: photos" }).locator("select")).toHaveValue("Consent - photos");
  await expect(page.getByText("3 of 4 will be added")).toBeVisible();
  await expect(page.getByText("twice in file")).toBeVisible();
  await expect(page.getByText("unreadable date of birth")).toBeVisible();
  await shot(page, `${testInfo.project.name}-import-preview`);

  await page.getByRole("button", { name: "Import 3 rows" }).click();
  await expect(page.getByRole("heading", { name: "Done" })).toBeVisible();
  await expect(page.getByText("Added").locator("..").getByText("2")).toBeVisible();
  await expect(page.getByText("Flagged as duplicates").locator("..").getByText("1")).toBeVisible();

  const rows = await sql<{ first_name: string; dob: string; source: string; possible_duplicate: boolean; submitted_at: string; guardians: number }>(
    `select p.first_name, p.dob::text, r.source, r.possible_duplicate, r.submitted_at::text,
            (select count(*)::int from public.people g where g.club_id = p.club_id and g.kind = 'guardian') as guardians
     from public.registrations r join public.people p on p.id = r.player_person_id where r.club_id = $1 order by r.submitted_at`,
    [clubId],
  );
  expect(rows.map((r) => [r.first_name, r.dob, r.source, r.possible_duplicate])).toEqual([
    ["Ali", "2015-05-04", "import", false],
    ["Layla", "2013-08-19", "import", false],
    ["Ali", "2015-05-04", "import", true],
  ]);
  expect(rows[0].submitted_at.startsWith("2026-09-20")).toBeTruthy();
  expect(rows[0].guardians).toBe(1); // one Sana, reused by email
  const [consent] = await sql<{ text_shown: string; granted: boolean }>("select text_shown, granted from public.consents c join public.registrations r on r.id = c.registration_id where r.club_id = $1 and c.consent_key = 'photos' order by c.granted_at limit 1", [clubId]);
  expect(consent.text_shown).toContain('Imported from sonics-registrations.csv, column "Consent - photos"');
  const [imp] = await sql<{ row_count: number; result: { created: number; duplicates: number; errors: unknown[] } }>("select row_count, result from public.imports where club_id = $1", [clubId]);
  expect(imp.row_count).toBe(4);
  expect(imp.result).toMatchObject({ created: 3, duplicates: 1 });
  const [{ n }] = await sql<{ n: number }>("select count(*)::int as n from public.audit_log where action = 'import' and club_id = $1", [clubId]);
  expect(n).toBe(1);
});

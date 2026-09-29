import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { seedLiveClub, sql } from "./helpers";

const SHOTS = path.join(__dirname, "screenshots");
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function createAdmin(clubId: string, email: string, password: string) {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Members Admin" } });
  if (error) throw error;
  await sql("insert into public.club_users (club_id, user_id, role) values ($1, $2, 'admin')", [clubId, data.user.id]);
  return data.user.id;
}

const registration = (i: number, over: Record<string, string> = {}) => ({
  values: {
    player_first_name: `Player${i}`,
    player_last_name: "Synthetic",
    dob: `201${4 + (i % 3)}-0${1 + (i % 9)}-1${i % 9}`,
    gender: i % 2 ? "Girl" : "Boy",
    school: i % 2 ? "North Primary" : "South Primary",
    experience: i % 2 ? "Brand new" : "Played a season or two",
    uniform_size: "Youth M",
    guardian_first_name: `Parent${i}`,
    guardian_last_name: "Synthetic",
    relationship: "Mother",
    guardian_mobile: `0400 000 10${i}`,
    guardian_email: `parent${i}@family.example`,
    emergency_name: "Emergency Person",
    emergency_phone: "0400 000 999",
    medical: i === 2 ? "Peanut allergy, carries EpiPen" : "None",
    ambulance_cover: "Yes",
    heard_via: i % 2 ? "Instagram" : "Word of mouth",
    ...over,
  },
  consents: { medical: true, conduct: true, photos: i !== 3 },
});

test.describe("members database", () => {
  test("admin sees registrations, filters, reads medical details (audited), edits, archives and exports", async ({ page, request }, testInfo) => {
    const stamp = Date.now().toString(36);
    const { slug, clubId } = await seedLiveClub(stamp);
    const email = `members-admin-${stamp}@e2e.test`;
    const password = "Passw0rd!e2e";
    const adminId = await createAdmin(clubId, email, password);
    const tag = testInfo.project.name;

    // Six registrations through the public endpoint, the last one a duplicate of the first
    for (let i = 1; i <= 5; i++) {
      const res = await request.post("/api/register", { data: { slug, ...registration(i) } });
      expect(res.ok(), await res.text()).toBeTruthy();
    }
    const dup = await request.post("/api/register", { data: { slug, ...registration(1, { uniform_size: "Youth L" }) } });
    expect(dup.ok()).toBeTruthy();

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(new RegExp(`/app/${slug}`));

    await page.goto(`/app/${slug}/members`);
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
    await expect(page.getByText("5 players", { exact: true })).toBeVisible();
    await expect(page.getByText("dup")).toHaveCount(1);
    await shot(page, `${tag}-members-list`);

    // Scoreboard filters
    await expect(page.getByRole("button", { name: "Add player" })).toHaveCSS("color", "rgb(14, 15, 18)");
    await page.getByRole("button", { name: /Girls/ }).click();
    await expect(page.getByText("3 players matching")).toBeVisible();
    await page.getByRole("button", { name: "Clear" }).click();
    await page.getByPlaceholder(/Search name/).fill("peanut");
    await expect(page.getByText("0 players matching")).toBeVisible(); // medical text is never in the table
    await page.getByPlaceholder(/Search name/).fill("parent3@");
    await expect(page.getByText("1 player matching")).toBeVisible();
    await page.getByPlaceholder(/Search name/).fill("");

    // Open a player, reveal medical details (audited), edit the school, save
    await page.getByRole("cell", { name: /Player2 Synthetic/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Show medical and emergency details" }).click();
    await expect(page.getByText("Peanut allergy, carries EpiPen")).toBeVisible();
    await shot(page, `${tag}-members-person`);
    const [{ n: views }] = await sql<{ n: number }>("select count(*)::int as n from public.audit_log where action = 'sensitive.view' and actor_user_id = $1", [adminId]);
    expect(views).toBe(1);

    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("School").fill("Edited Primary");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("dialog").getByText("Edited Primary")).toBeVisible();
    await page.getByRole("button", { name: "Paid", exact: true }).click();
    await expect(page.getByRole("dialog").getByText("Paid", { exact: true }).first()).toBeVisible();

    // Archive the duplicate
    await page.getByRole("button", { name: "Close" }).last().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("cell", { name: /Player1 Synthetic/ }).first().click();
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await expect(page.getByText("4 players", { exact: true })).toBeVisible();
    const [{ n: archived }] = await sql<{ n: number }>("select count(*)::int as n from public.audit_log where action = 'person.archive' and club_id = $1", [clubId]);
    expect(archived).toBe(1);

    // Export the current view as CSV, with the girls filter on
    await page.getByRole("button", { name: /Girls/ }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "CSV" }).click()]);
    const body = await (await download.createReadStream()).toArray();
    const csv = Buffer.concat(body).toString("utf8");
    expect(csv).toContain("Player name");
    expect(csv).toContain("Player3 Synthetic");
    expect(csv).toContain("Player5 Synthetic");
    expect(csv).not.toContain("Player1 Synthetic"); // archived
    expect(csv).not.toContain("Player2 Synthetic"); // a boy
    expect(csv).toContain('"Emergency Person"'); // admins export the sensitive columns, and it is logged
    expect(csv.trim().split("\r\n").length).toBe(3); // header + 2 rows
    const [audit] = await sql<{ detail: { format: string; count: number; filters: string } }>("select detail from public.audit_log where action = 'export' and club_id = $1 order by at desc limit 1", [clubId]);
    expect(audit.detail).toMatchObject({ format: "csv", count: 2, filters: "gender girl" });

    // A coach cannot open the members page at all
  });
});

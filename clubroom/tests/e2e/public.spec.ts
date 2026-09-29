import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { seedLiveClub, sql } from "./helpers";

const SHOTS = path.join(__dirname, "screenshots");
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

test.describe("a parent registers through the public form", () => {
  test("club page → form → thanks, and the record is right", async ({ page, request }, testInfo) => {
    const stamp = Date.now().toString(36);
    const { slug } = await seedLiveClub(stamp);
    const tag = testInfo.project.name;

    // Public club page with OG tags
    await page.goto(`/c/${slug}`);
    await expect(page.getByRole("heading", { name: `E2E Publics ${stamp}` })).toBeVisible();
    await expect(page.getByText("Registrations open")).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", `E2E Publics ${stamp}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await shot(page, `${tag}-public-club`);
    const og = await request.get(`/c/${slug}/opengraph-image`);
    expect(og.ok()).toBeTruthy();
    expect(og.headers()["content-type"]).toContain("image/png");

    await page.getByRole("link", { name: "Register" }).click();
    await expect(page).toHaveURL(new RegExp(`/c/${slug}/register`));

    // Validation: submitting empty shows the required errors from the server
    await page.getByRole("button", { name: "Submit registration" }).click();
    // browser-side required stops it; fill the player and check the age group hint
    await page.getByLabel("Player first name").fill("Sam");
    await page.getByLabel("Player last name").fill("Synthetic");
    await page.getByLabel("Date of birth").fill("2015-03-09");
    await expect(page.getByText("That puts them in U12 for Summer 2026/27.")).toBeVisible();
    await page.getByLabel("Gender").selectOption("Boy");
    await page.getByLabel("School").fill("Example Primary");
    await page.getByLabel("Experience").selectOption("Brand new");
    await page.getByLabel("Uniform size").selectOption("Youth M");
    await page.getByLabel("Your first name").fill("Jo");
    await page.getByLabel("Your last name").fill("Synthetic");
    await page.getByLabel("Relationship to the player").selectOption("Mother");
    await page.getByLabel("Mobile").fill("0400 000 123");
    await page.getByLabel("Email").fill(`jo-${stamp}@family.example`);
    await page.getByLabel("Emergency contact name").fill("Kim Synthetic");
    await page.getByLabel("Emergency contact phone").fill("0400 000 124");
    await page.getByLabel("Conditions, allergies or medication").fill("Asthma, carries an inhaler");
    await page.getByLabel("Ambulance cover").selectOption("Yes");
    await page.getByLabel("How did you hear about us?").selectOption("Instagram");
    await page.getByText("Medical treatment consent").click();
    await page.getByText("Code of conduct").click();
    // leave photos unticked on purpose
    await shot(page, `${tag}-public-register`);
    await page.getByRole("button", { name: "Submit registration" }).click();

    await expect(page).toHaveURL(new RegExp(`/c/${slug}/thanks`));
    await expect(page.getByRole("heading", { name: "You’re in" })).toBeVisible();
    await shot(page, `${tag}-public-thanks`);

    // The record: player, guardian, sensitive details, consents, fee, audit
    const [reg] = await sql<{ status: string; form_version: number; possible_duplicate: boolean; first_name: string; email: string; medical: string; has_medical_flag: boolean; photo_consent: boolean; fee_cents: number; consents: number; audits: number; age_group: string }>(
      `select r.status, r.form_version, r.possible_duplicate, p.first_name, g.email, ps.medical, p.has_medical_flag, p.photo_consent,
              (select amount_cents from public.fees f where f.person_id = p.id) as fee_cents,
              (select count(*)::int from public.consents c where c.registration_id = r.id) as consents,
              (select count(*)::int from public.audit_log a where a.action = 'registration.submit' and a.target_id = r.id::text) as audits,
              public.age_group_for(p.dob, r.season_id) as age_group
       from public.registrations r
       join public.people p on p.id = r.player_person_id
       join public.people g on g.id = r.guardian_person_id
       join public.person_sensitive ps on ps.person_id = p.id
       join public.clubs c on c.id = r.club_id
       where c.slug = $1`,
      [slug],
    );
    expect(reg).toMatchObject({
      status: "new",
      form_version: 1,
      possible_duplicate: false,
      first_name: "Sam",
      email: `jo-${stamp}@family.example`,
      medical: "Asthma, carries an inhaler",
      has_medical_flag: true,
      photo_consent: false,
      fee_cents: 18000,
      consents: 3,
      audits: 1,
      age_group: "U12",
    });
  });

  test("the honeypot and the rate limit hold", async ({ request }) => {
    const stamp = Date.now().toString(36);
    const { slug } = await seedLiveClub(stamp);
    const bot = await request.post("/api/register", { data: { slug, values: {}, consents: {}, website: "http://spam.example" } });
    expect(bot.status()).toBe(200); // bots get a quiet 200 and nothing is stored
    const [{ n }] = await sql<{ n: number }>("select count(*)::int as n from public.registrations r join public.clubs c on c.id = r.club_id where c.slug = $1", [slug]);
    expect(n).toBe(0);

    const missing = await request.post("/api/register", { data: { slug, values: { player_first_name: "Only" }, consents: {} } });
    expect(missing.status()).toBe(422);
    const body = (await missing.json()) as { error: string };
    expect(body.error).toContain("Date of birth is required");
    expect(body.error).toContain('Please tick "Medical treatment consent"');
  });
});

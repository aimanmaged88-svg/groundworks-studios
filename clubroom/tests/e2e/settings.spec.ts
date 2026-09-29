import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { seedLiveClub, sql } from "./helpers";

const SHOTS = path.join(__dirname, "screenshots");
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function signIn(page: Page, email: string, slug: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Passw0rd!e2e");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${slug}`));
}

test("settings: club details, form builder versions, coach invite with least privilege, billing", async ({ page, browser }, testInfo) => {
  const stamp = Date.now().toString(36);
  const { slug, clubId } = await seedLiveClub(stamp);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const email = `settings-admin-${stamp}@e2e.test`;
  const { data: u, error } = await admin.auth.admin.createUser({ email, password: "Passw0rd!e2e", email_confirm: true, user_metadata: { full_name: "Settings Admin" } });
  if (error || !u.user) throw error ?? new Error("no user");
  await sql("insert into public.club_users (club_id, user_id, role) values ($1, $2, 'admin')", [clubId, u.user.id]);
  const tag = testInfo.project.name;

  await signIn(page, email, slug);

  // Club details
  await page.goto(`/app/${slug}/settings`);
  await page.getByLabel("Short name").fill("Pubs");
  await page.getByLabel("Headline").fill("Summer comp is on");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await shot(page, `${tag}-settings-club`);
  const [club] = await sql<{ short_name: string; public_page: { headline: string } }>("select short_name, public_page from public.clubs where id = $1", [clubId]);
  expect(club.short_name).toBe("Pubs");
  expect(club.public_page.headline).toBe("Summer comp is on");

  // Form builder: add a custom question, publish version 2, see it on the public form
  await page.goto(`/app/${slug}/settings/form`);
  await expect(page.getByText("Version 1")).toBeVisible();
  await page.getByRole("button", { name: "Add a question" }).last().click();
  await page.getByLabel("Question label").last().fill("Jersey number they'd love");
  await shot(page, `${tag}-settings-form`);
  await page.getByRole("button", { name: "Publish version 2" }).click();
  await expect(page.getByText("Saved as version 2")).toBeVisible();
  await page.goto(`/c/${slug}/register`);
  await expect(page.getByLabel("Jersey number they'd love")).toBeVisible();
  const [tmpl] = await sql<{ version: number; n: number }>("select version, (select count(*)::int from public.form_templates where club_id = $1) as n from public.form_templates where club_id = $1 and is_active", [clubId]);
  expect(tmpl).toEqual({ version: 2, n: 2 });

  // Invite a coach; accept in a fresh browser context; the coach can't reach Members
  await page.goto(`/app/${slug}/settings/people`);
  await page.getByLabel("Email").fill(`coach-${stamp}@e2e.test`);
  await page.getByLabel("Role").selectOption("coach");
  await page.getByLabel("First name").fill("Casey");
  await page.getByLabel("Last name").fill("Coach");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByText(/send .* this link yourself/)).toBeVisible();
  const link = (await page.locator("code").first().textContent())!.trim();
  await expect(page.getByText(`coach-${stamp}@e2e.test`).first()).toBeVisible();
  await shot(page, `${tag}-settings-people`);

  const ctx = await browser.newContext();
  const coach = await ctx.newPage();
  await coach.goto(link);
  await expect(coach.getByText("You’ve been invited to join")).toBeVisible();
  await coach.getByRole("link", { name: "Create a login to join" }).click();
  await coach.getByLabel("Your name").fill("Casey Coach");
  await coach.getByLabel("Email").fill(`coach-${stamp}@e2e.test`);
  await coach.getByLabel("Password").fill("Passw0rd!e2e");
  await coach.getByRole("button", { name: "Create my login" }).click();
  await coach.getByRole("button", { name: /Join / }).click();
  await expect(coach).toHaveURL(new RegExp(`/app/${slug}$`));
  await expect(coach.getByText("You’re in.")).toBeVisible();
  const membersForCoach = await coach.goto(`/app/${slug}/members`);
  expect(membersForCoach?.status()).toBe(404);
  const [staff] = await sql<{ user_id: string | null; roles: string[] }>("select p.user_id, (select array_agg(role::text) from public.club_users cu where cu.club_id = $1 and cu.user_id = p.user_id) as roles from public.people p where p.club_id = $1 and p.kind = 'staff' and p.email = $2", [clubId, `coach-${stamp}@e2e.test`]);
  expect(staff.user_id).not.toBeNull();
  expect(staff.roles).toEqual(["coach"]);
  await ctx.close();

  // Billing without Stripe keys: shows the state, never charges
  await page.goto(`/app/${slug}/settings/billing`);
  await expect(page.getByText("Free trial")).toBeVisible();
  await expect(page.getByText(/aren.t switched on in this environment/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose" })).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Choose" }).first()).toBeDisabled();
  await shot(page, `${tag}-settings-billing`);
});

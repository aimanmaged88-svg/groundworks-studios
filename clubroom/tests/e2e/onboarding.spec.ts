import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const SHOTS = path.join(__dirname, "screenshots");
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

test.describe("a club signs up and goes live", () => {
  test("sign-up → wizard → live", async ({ page }, testInfo) => {
    const stamp = Date.now().toString(36);
    const email = `admin-${stamp}@e2e.test`;
    const clubName = `E2E Hoops ${stamp}`;
    const slug = `e2e-hoops-${stamp}`;
    const tag = testInfo.project.name;

    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Test Admin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Passw0rd!e2e");
    await page.getByRole("button", { name: "Create my login" }).click();

    await expect(page).toHaveURL(/\/start/);
    await expect(page.getByRole("heading", { name: "Your club" })).toBeVisible();

    // Step 1: the club
    await page.getByLabel("Club name").fill(clubName);
    await page.getByLabel("Sport").selectOption("basketball");
    await page.getByLabel("Suburb").fill("Bankstown");
    await expect(page.locator("#slug")).toHaveValue(slug);
    await expect(page.getByText("Available.")).toBeVisible();
    await shot(page, `${tag}-wizard-1-club`);
    await page.getByRole("button", { name: "Create the club" }).click();

    // Step 2: look
    await expect(page.getByRole("heading", { name: "Logo and colours" })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "..", "fixtures", "logo.svg"));
    await expect(page.getByText("Change logo")).toBeVisible();
    // the palette from the logo should pick the vivid orange over the big dark ring
    await expect
      .poll(async () => {
        const hex = (await page.locator('input[aria-label="Main colour picker"]').inputValue()).toLowerCase();
        const n = parseInt(hex.slice(1), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
      })
      .toEqual({ r: expect.any(Number), g: expect.any(Number), b: expect.any(Number) });
    const hex = (await page.locator('input[aria-label="Main colour picker"]').inputValue()).toLowerCase();
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    expect(r, `primary ${hex} should be orange`).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(50);
    expect(g).toBeLessThan(140);
    expect(b).toBeLessThan(80);
    await page.getByLabel("Instagram").fill("e2ehoops");
    await shot(page, `${tag}-wizard-2-look`);
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3: venues
    await expect(page.getByRole("heading", { name: "Where you play" })).toBeVisible();
    await page.getByPlaceholder(/Venue name/).fill("Test Stadium");
    await page.getByPlaceholder("Address").fill("1 Court Street, Bankstown NSW");
    await shot(page, `${tag}-wizard-3-venues`);
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4: season
    await expect(page.getByRole("heading", { name: "Season and age groups" })).toBeVisible();
    await expect(page.getByLabel("Age group name").first()).toHaveValue("U10");
    await page.getByRole("button", { name: "Year they were born" }).click();
    await expect(page.getByText("Born", { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel("Born from").nth(1)).toHaveValue(String(new Date().getFullYear() - 11));
    await page.getByRole("button", { name: "Age on a set date" }).click();
    await shot(page, `${tag}-wizard-4-season`);
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 5: fees
    await expect(page.getByRole("heading", { name: "Fees" })).toBeVisible();
    await page.getByRole("button", { name: "Set the fee now" }).click();
    await page.getByLabel("Amount").fill("180");
    await shot(page, `${tag}-wizard-5-fees`);
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 6: people
    await expect(page.getByRole("heading", { name: "Other admins" })).toBeVisible();
    await page.getByLabel("Email addresses").fill(`second-${stamp}@e2e.test`);
    await page.getByRole("button", { name: "Send invites" }).click();
    await expect(page.getByText(/send them this link/)).toBeVisible();
    await shot(page, `${tag}-wizard-6-people`);
    await page.getByRole("button", { name: "Done inviting" }).click();

    // Step 7: go live
    await expect(page.getByRole("heading", { name: "Go live" })).toBeVisible();
    await expect(page.getByText(`/c/${slug}/register`)).toBeVisible();
    await expect(page.getByText("$180 per player, per season")).toBeVisible();
    await shot(page, `${tag}-wizard-7-live`);
    await page.locator('button[type="submit"]', { hasText: "Go live" }).click();

    await expect(page).toHaveURL(new RegExp(`/app/${slug}`));
    await expect(page.getByText("You’re live.")).toBeVisible();
    await expect(page.getByRole("heading", { name: clubName })).toBeVisible();
    await shot(page, `${tag}-app-home-welcome`);

    // the share page carries the same link and a QR code
    await page.getByRole("link", { name: "Share", exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByRole("heading", { name: "Get the link out" })).toBeVisible();
    await expect(page.getByTestId("qr").locator("svg")).toBeVisible();
    await shot(page, `${tag}-app-share`);
  });
});

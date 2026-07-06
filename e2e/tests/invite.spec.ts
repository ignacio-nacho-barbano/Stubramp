import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// Seeded ADMIN in the demo company (apps/api/prisma/seed.ts). Only admins see
// the "Invite teammate" action.
const ADMIN_EMAIL = "admin@demo.test";
const PASSWORD = "demo-password";

// The auth pages are server-rendered then hydrated a beat later. Filling before
// hydration is unsafe: React reconciles the controlled inputs back to empty
// state, so a too-early submit sends blank values. auth.spec.ts absorbs this by
// retrying fill+submit — but the auth endpoints are rate limited (5/min per IP),
// and each retry is a request. Instead, retry only the *fill* (no network) until
// the typed value survives reconciliation, which proves hydration has landed;
// then every field is filled post-hydration and we submit exactly once.
async function fillWhenHydrated(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 15_000 });
}

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await fillWhenHydrated(page.getByLabel("Work email"), ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/bills/, { timeout: 10_000 });
}

test.describe("workspace invites", () => {
  test("an admin invites a teammate who joins the existing workspace", async ({
    page,
    browser,
  }) => {
    await loginAsAdmin(page);

    // Open the user menu and mint an invite link. The token is returned by the
    // API — grab it straight off the response rather than the clipboard (which
    // is brittle in headless Chromium).
    const invite = page.waitForResponse(
      (r) =>
        r.url().includes("/auth/invites") && r.request().method() === "POST",
    );
    await page.getByText("DA", { exact: true }).click(); // Demo Admin avatar
    await page.getByRole("button", { name: "Invite teammate" }).click();
    const { token } = (await (await invite).json()) as { token: string };
    expect(token).toBeTruthy();

    // A fresh browser context = a brand-new visitor with no admin cookies.
    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    const email = `invitee-${Date.now()}@demo.test`;

    await guestPage.goto(`/join?token=${encodeURIComponent(token)}`);
    await fillWhenHydrated(guestPage.getByLabel("First name"), "Test");
    await guestPage.getByLabel("Last name").fill("Invitee");
    await guestPage.getByLabel("Work email").fill(email);
    await guestPage.locator('input[type="password"]').fill(PASSWORD);
    await guestPage.getByRole("checkbox").check();
    await guestPage.getByRole("button", { name: "Join workspace" }).click();
    await expect(guestPage.getByText("You're in")).toBeVisible({
      timeout: 10_000,
    });

    // Following through lands the new teammate inside the workspace — proving the
    // API set the session cookies and the /_app guard accepted them.
    await guestPage.getByRole("button", { name: "Open workspace" }).click();
    await expect(guestPage).toHaveURL(/\/bills/, { timeout: 10_000 });

    await guest.close();
  });

  test("a malformed invite token is rejected on submit", async ({ page }) => {
    // A present-but-bogus token still renders the form; the API rejects it on
    // submit with an invite-specific error banner.
    await page.goto("/join?token=not-a-real-token");
    await fillWhenHydrated(page.getByLabel("First name"), "Test");
    await page.getByLabel("Last name").fill("Invitee");
    await page.getByLabel("Work email").fill("nope@demo.test");
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Join workspace" }).click();
    await expect(
      page.getByText("This invite link is invalid", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

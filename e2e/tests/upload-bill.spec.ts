import { fileURLToPath } from "node:url";
import path from "node:path";
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// Exercises the full "New bill" flow end-to-end, both entry points:
//   1. Enter manually  — type vendor + invoice # + a line item, save a draft.
//   2. Upload invoice  — drop a PDF, the API (POST /bills/parse) extracts the
//      fields, the standard create form is pre-filled for review, then saved.
//
// Both land on the bill detail page, which proves the whole chain wired up:
// browser -> TanStack Start server fns -> Fastify API (POST /bills) -> Postgres.
//
// Seeded fixtures (apps/api/prisma/seed.ts): admin@demo.test / demo-password is
// an ADMIN in the demo company, which has one vendor, "Acme Supplies".
const ADMIN_EMAIL = "admin@demo.test";
const PASSWORD = "demo-password";
const SEEDED_VENDOR = "Acme Supplies";

// Sample invoice PDFs live at repo-root docs/samples/invoices (../.. from here).
const INVOICES_DIR = path.resolve(
  fileURLToPath(import.meta.url),
  "../../../docs/samples/invoices",
);
// sample_invoice_1.pdf is a clean text-based invoice the heuristic parser reads
// end-to-end. Its fields (see the PDF) drive the assertions below:
//   Invoice #: INV-TEST-00123, four line items summing to $1,505.00 (500 + 750 +
//   135 + 120 = the subtotal), plus the printed "Total Due: $1,625.40". The
//   parser extracts both the line rows and the grand total; the confirm screen
//   reconciles the gap with a "Tax & adjustments" line ($120.40) so the bill
//   total equals Total Due.
const SAMPLE_PDF = path.join(INVOICES_DIR, "sample_invoice_1.pdf");
const SAMPLE_BILL_NUMBER = "INV-TEST-00123";
const SAMPLE_VENDOR_DETECTED = "Northwind Sample Co.";

// The app is server-rendered then hydrated a beat later; filling a controlled
// input before hydration lands lets React reconcile the value back to empty.
// Retry only the fill (no network) until the typed value survives — that proves
// hydration has landed. Same technique as invite.spec.ts.
async function fillWhenHydrated(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 15_000 });
}

// The auth endpoints are rate limited to 5 requests/min per IP (apps/api
// src/routes/auth.ts). Across the fully-parallel suite the combined logins can
// exhaust that bucket, and the API replies with an inline "Rate limit exceeded,
// retry in N seconds" banner. This helper is a leaf (it doesn't test login), so
// it just backs off for the advertised window and submits once more — keeping
// the test independent without piling extra attempts onto the shared bucket.
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await fillWhenHydrated(page.getByLabel("Work email"), ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.getByRole("button", { name: "Log in" }).click();

    const landed = page.waitForURL(/\/bills/, { timeout: 10_000 }).then(
      () => "ok" as const,
      () => "timeout" as const,
    );
    const limited = page
      .getByText(/Rate limit exceeded, retry in (\d+) seconds/)
      .waitFor({ timeout: 10_000 })
      .then(
        () => "limited" as const,
        () => "none" as const,
      );
    const outcome = await Promise.race([landed, limited]);
    if (outcome === "ok") return;

    const banner = await page
      .getByText(/Rate limit exceeded, retry in (\d+) seconds/)
      .textContent()
      .catch(() => null);
    const seconds = Number(banner?.match(/retry in (\d+) seconds/)?.[1] ?? 0);
    if (!seconds) break; // not a rate-limit failure — fall through and assert.
    await page.waitForTimeout((seconds + 1) * 1000);
  }

  await expect(page).toHaveURL(/\/bills/, { timeout: 10_000 });
}

// A freshly created bill navigates to /bills/<uuid>.
const BILL_DETAIL_URL = /\/bills\/[0-9a-f-]{36}$/;

test.describe("new bill flow", () => {
  // loginAsAdmin may back off for a full rate-limit window (~60s) when the
  // shared 5/min auth bucket is saturated by the parallel suite (or a CI retry).
  // Triple the default 30s timeout so that backoff can complete within a test.
  test.beforeEach(() => test.slow());

  test("creates a bill by entering details manually", async ({ page }) => {
    await loginAsAdmin(page);

    // Open the "+ New bill" menu and choose the manual entry path.
    await page.getByRole("button", { name: "+ New bill" }).click();
    await page.getByText("Enter manually").click();
    await expect(page).toHaveURL(/\/bills\/new/);
    await expect(page.getByRole("heading", { name: "New bill" })).toBeVisible();

    // Pick the seeded vendor, set an invoice number and one line item.
    await page.getByRole("combobox").selectOption({ label: SEEDED_VENDOR });
    await fillWhenHydrated(page.getByLabel("Invoice #"), "INV-E2E-MANUAL");
    // A due date is required by the create contract (dueDate: z.coerce.date()).
    await page.getByLabel("Due date").fill("2026-07-31");
    await page.getByPlaceholder("Description").fill("Consulting services");
    await page.getByPlaceholder("0.00").fill("1200");

    // Summary should reflect the vendor + total before we commit.
    await expect(page.getByText("$1,200.00").first()).toBeVisible();

    await page.getByRole("button", { name: "Save as draft" }).click();

    // Landing on the detail page proves POST /bills succeeded and persisted.
    await expect(page).toHaveURL(BILL_DETAIL_URL, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: SEEDED_VENDOR }),
    ).toBeVisible();
    await expect(page.getByText("INV-E2E-MANUAL").first()).toBeVisible();
    await expect(page.getByText("Consulting services").first()).toBeVisible();
  });

  test("creates a bill by uploading and parsing a PDF invoice", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Open the "+ New bill" menu and choose the upload path.
    await page.getByRole("button", { name: "+ New bill" }).click();
    await page.getByText("Upload invoice (PDF)").click();
    await expect(page).toHaveURL(/\/bills\/new\?mode=upload/);
    await expect(
      page.getByRole("heading", { name: "Upload invoice" }),
    ).toBeVisible();

    // Drop the PDF onto react-dropzone's (hidden) file input and wait for the
    // API to extract the fields.
    const parsed = page.waitForResponse(
      (r) =>
        r.url().includes("/bills/parse") && r.request().method() === "POST",
    );
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
    expect((await parsed).status()).toBe(200);

    // The parsed fields seed the standard create form. The invoice number is
    // extracted verbatim; the vendor name doesn't match a seeded vendor, so it
    // surfaces as a "detected" hint instead of pre-selecting one.
    await expect(page.getByLabel("Invoice #")).toHaveValue(SAMPLE_BILL_NUMBER, {
      timeout: 15_000,
    });
    await expect(
      page.getByText(SAMPLE_VENDOR_DETECTED, { exact: false }),
    ).toBeVisible();
    // Line items came across (first row description from the PDF).
    await expect(page.getByPlaceholder("Description").first()).toHaveValue(
      "Sample Widget Design Services",
    );
    // The four line rows ($1,505.00 subtotal) are reconciled up to the invoice's
    // "Total Due: $1,625.40" by a synthesized "Tax & adjustments" line ($120.40).
    await expect(page.getByPlaceholder("Description").last()).toHaveValue(
      "Tax & adjustments",
    );
    await expect(page.getByText("$1,625.40").first()).toBeVisible();

    // The PDF's vendor isn't seeded, so pick the known vendor to satisfy the
    // required field, then save the reviewed draft.
    await page.getByRole("combobox").selectOption({ label: SEEDED_VENDOR });
    await page.getByRole("button", { name: "Save as draft" }).click();

    await expect(page).toHaveURL(BILL_DETAIL_URL, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: SEEDED_VENDOR }),
    ).toBeVisible();
    await expect(page.getByText(SAMPLE_BILL_NUMBER).first()).toBeVisible();
    await expect(
      page.getByText("Sample Widget Design Services").first(),
    ).toBeVisible();
  });
});

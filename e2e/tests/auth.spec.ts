import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Credentials come from the API seed (apps/api/prisma/seed.ts): every seeded
// user shares the password "demo-password". admin@demo.test is an ADMIN scoped
// to the demo company.
const EMAIL = 'admin@demo.test'
const PASSWORD = 'demo-password'

// During Vite dev the login page is server-rendered first and hydrated a beat
// later. Until React hydrates, the <form> has no onSubmit handler — so the
// submit button does a native GET (reloading /login) — and values typed into
// the controlled inputs can be wiped when React reconciles them back to state.
// Rather than guess when hydration lands, retry "fill + submit" until the
// expected post-submit state appears. This is self-healing against the race
// without coupling to any framework-internal hydration signal.
async function fillAndSubmit(page: Page, email: string, password: string) {
  await page.getByLabel('Work email').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
}

test.describe('authentication', () => {
  test('logs in and lands on the bills page', async ({ page }) => {
    await page.goto('/login')

    await expect(async () => {
      await fillAndSubmit(page, EMAIL, PASSWORD)
      // Reaching /bills proves the whole chain: loginFn set the httpOnly
      // session cookies, and the /_app guard's meFn (-> /auth/me) accepted
      // them. A stray `secure` flag over http would bounce us back to /login.
      await expect(page).toHaveURL(/\/bills/, { timeout: 5000 })
    }).toPass({ timeout: 30_000 })
  })

  test('rejects a wrong password with an inline error', async ({ page }) => {
    await page.goto('/login')

    await expect(async () => {
      await fillAndSubmit(page, EMAIL, 'not-the-password')
      await expect(
        page.getByText('Incorrect email or password.'),
      ).toBeVisible({ timeout: 5000 })
    }).toPass({ timeout: 30_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})

import { expect, test } from '@playwright/test'

// Credentials come from the API seed (apps/api/prisma/seed.ts): every seeded
// user shares the password "demo-password". admin@demo.test is an ADMIN scoped
// to the demo company.
const EMAIL = 'admin@demo.test'
const PASSWORD = 'demo-password'

test.describe('authentication', () => {
  test('logs in and lands on the bills page', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Work email').fill(EMAIL)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()

    // Reaching /bills proves the full chain: loginFn set the httpOnly session
    // cookies, and the /_app guard's meFn (-> /auth/me) accepted them. If the
    // cookies had not persisted (e.g. a stray `secure` flag over http), the
    // guard would bounce us back to /login instead.
    await expect(page).toHaveURL(/\/bills/)
  })

  test('rejects a wrong password with an inline error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Work email').fill(EMAIL)
    await page.locator('input[type="password"]').fill('not-the-password')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByText('Incorrect email or password.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})

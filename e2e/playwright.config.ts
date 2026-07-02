import { defineConfig, devices } from '@playwright/test'

// End-to-end suite for the whole logged-in flow:
//   browser -> TanStack Start app (SSR server fns) -> Fastify API -> Postgres.
//
// The `webServer` block boots BOTH apps and waits on their health checks before
// tests run. Every process inherits `process.env`, so the DB/API/app env vars
// (set at the GitHub Actions job level, or exported locally against a scratch
// Neon branch) flow straight through — see .github/workflows/e2e.yml.
const APP_PORT = 3000
const API_PORT = 3001
const APP_URL = process.env.APP_URL ?? `http://localhost:${APP_PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { open: 'never' }],
    ['github'],
    ['list'],
  ],
  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      // Fastify API — `tsx watch src/index.ts`. /health runs `SELECT 1`, so a
      // healthy response also proves the Neon branch is reachable + migrated.
      command: 'pnpm --filter @stubramp/api dev',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // TanStack Start app via Vite (dev:ci drops the .env.local dotenv wrapper
      // so job-level env vars — notably API_URL — reach the SSR layer).
      command: 'pnpm --filter @stubramp/app dev:ci',
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})

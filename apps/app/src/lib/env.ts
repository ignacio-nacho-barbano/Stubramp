import { z } from 'zod'

// Validated client env. Vite inlines `import.meta.env.VITE_*` at build time, so
// this parses once at module load and fails fast (during dev/build) on a
// malformed value rather than surfacing as a confusing runtime error. Only
// `VITE_`-prefixed vars are exposed to the browser bundle.
const envSchema = z.object({
  // The API origin the SPA calls. Defaults to the local API for dev.
  VITE_API_URL: z.string().url().default('http://localhost:3001'),
  // Optional Sentry DSN; when unset, error reporting is disabled.
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  VITE_ENV: z.enum(['local', 'dev', 'prod']).default('local'),
})

const parsed = envSchema.safeParse(import.meta.env)
if (!parsed.success) {
  const fieldErrors = z.flattenError(parsed.error).fieldErrors
  throw new Error(
    `Invalid client environment configuration:\n${JSON.stringify(fieldErrors, null, 2)}`,
  )
}

export const env = parsed.data

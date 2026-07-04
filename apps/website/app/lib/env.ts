import { z } from 'zod'

// Validated env for the marketing site. Next inlines `NEXT_PUBLIC_*` vars into
// the bundle; parsing here fails fast on a malformed value at module load rather
// than silently linking visitors to a bad URL.
const envSchema = z.object({
  // Where the marketing site sends visitors to authenticate (the product app).
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  const fieldErrors = z.flattenError(parsed.error).fieldErrors
  throw new Error(
    `Invalid website environment configuration:\n${JSON.stringify(fieldErrors, null, 2)}`,
  )
}

export const env = parsed.data

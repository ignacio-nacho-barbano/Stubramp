import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@stubramp/ui/vite'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Only upload source maps when we have credentials (i.e. real prod builds in
  // CI). Local builds skip the upload but still emit hidden source maps.
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN
  const uploadSourceMaps = Boolean(
    sentryAuthToken && env.VITE_SENTRY_ORG && env.VITE_SENTRY_PROJECT,
  )

  return {
    // 'hidden' emits source maps for Sentry symbolication without referencing
    // them from the shipped bundles.
    build: { sourcemap: 'hidden' },
    plugins: [
      devtools(),
      tailwindcss(),
      // Generates routeTree.gen.ts from src/routes and enables route code-splitting.
      // Must run before the React plugin.
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
      uploadSourceMaps &&
        sentryVitePlugin({
          org: env.VITE_SENTRY_ORG,
          project: env.VITE_SENTRY_PROJECT,
          authToken: sentryAuthToken,
        }),
    ],
  }
})

export default config

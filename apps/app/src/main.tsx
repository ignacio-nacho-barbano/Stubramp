import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'

import { getRouter } from './router'
import { env } from './lib/env'
import { ErrorPage } from './components/ErrorPage'
import './styles.css'

// The router must exist before Sentry.init so the TanStack Router tracing
// integration can hook into navigations.
const router = getRouter()
const queryClient = router.options.context.queryClient

const sentryDsn = env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: env.VITE_ENV,
    sendDefaultPii: true,
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance tracing. Propagate trace headers to our own API so
    // frontend and backend spans stitch into one trace.
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', env.VITE_API_URL],
    // Session Replay: sample a slice of all sessions, but always capture
    // sessions where an error occurred.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
  })
}

const rootElement = document.getElementById('root')!

createRoot(rootElement, {
  // React 19 root-level error hooks forward render/commit errors to Sentry.
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => <ErrorPage onRetry={resetError} />}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

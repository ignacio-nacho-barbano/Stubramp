import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import * as Sentry from '@sentry/react'
import { routeTree } from './routeTree.gen'
import { getContext } from './integrations/tanstack-query/root-provider'
import { ErrorPage } from './components/ErrorPage'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ({ error, reset }) => {
      Sentry.captureException(error)
      return (
        <ErrorPage
          message={
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred. You can try again or head back home.'
          }
          onRetry={reset}
        />
      )
    },
    defaultNotFoundComponent: () => (
      <ErrorPage
        code="404"
        title="Page not found"
        message="The page you’re looking for doesn’t exist or may have moved."
      />
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

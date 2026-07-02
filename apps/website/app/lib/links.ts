/**
 * Where the marketing site sends visitors to authenticate. The product app
 * (apps/app) serves /login and /signup; in dev it runs on port 3000. Override
 * with NEXT_PUBLIC_APP_URL to point at a deployed app.
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const loginHref = `${APP_URL}/login`
export const signupHref = `${APP_URL}/signup`

/**
 * Where the marketing site sends visitors to authenticate. The product app
 * (apps/app) serves /login and /signup; in dev it runs on port 3000. Override
 * with NEXT_PUBLIC_APP_URL to point at a deployed app.
 */
import { env } from "./env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export const loginHref = `${APP_URL}/login`;
export const signupHref = `${APP_URL}/signup`;

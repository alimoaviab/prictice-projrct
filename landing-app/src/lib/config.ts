/**
 * Cross-app links — the school SPA lives at a different origin in
 * docker/production. Override with VITE_APP_URL at build time.
 */
export const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:3000";

export const LOGIN_URL = `${APP_URL}/auth/login`;
export const SIGNUP_URL = `${APP_URL}/auth/signup`;

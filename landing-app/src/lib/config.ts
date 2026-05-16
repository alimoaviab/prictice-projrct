// Auto-detect production environment to prevent localhost redirects on the live site.
const isProd = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname.includes('eduplexo.com'));

export const APP_URL = import.meta.env.VITE_APP_URL || (isProd ? "https://app.eduplexo.com" : "http://localhost:3000");

export const LOGIN_URL = `${APP_URL}/auth/login`;
export const SIGNUP_URL = `${APP_URL}/auth/signup`;

/**
 * Centralised public env access. Keep all `import.meta.env.*` reads in this
 * file so the rest of the app stays free of build-tool-specific globals.
 */

const stripTrailing = (value: string) => value.replace(/\/$/, "");

const apiBaseRaw = (import.meta.env.VITE_API_BASE_URL ?? "/api").trim();

export const env = {
  /** Base URL for service calls. Always relative ("/api") in dev. */
  apiBaseUrl: stripTrailing(apiBaseRaw) || "/api",
  /** When truthy, MSW boots in the browser to serve mock /api responses. */
  enableMocks: (import.meta.env.VITE_ENABLE_MOCKS ?? "true") === "true",
  appName: import.meta.env.VITE_APP_NAME ?? "Eduplexo — School Workspace",
  appDescription:
    import.meta.env.VITE_APP_DESCRIPTION ?? "Multi-school SaaS school workspace",
} as const;

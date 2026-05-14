# Eduplexo — School Workspace (React + Vite)

The full Eduplexo school-workspace frontend, ported from the original
Next.js + MongoDB application at `../old-app/school-app` to React 19 +
Vite 6 + TypeScript with the same UI, UX, routing, and API contract.

## Status

| Area | Status |
| --- | --- |
| Project scaffolding (Vite + React 19 + TS + Tailwind 4) | ✅ |
| Routing (every URL from the original app, role-guarded) | ✅ |
| Layouts (`SchoolShell`, `AuthLayout`, public landing) | ✅ |
| Auth flow (login, signup, protected routes, role redirects) | ✅ |
| Multi-tenant guards (cross-school cache invalidation) | ✅ |
| Academic-year selector (JWT re-issue on switch) | ✅ |
| Service client (`serviceRequest`, identical envelope) | ✅ |
| TanStack Query provider (tenant-scoped keys) | ✅ |
| Toast event-bus + `ToastProvider` | ✅ |
| MSW mock server (full /api/* surface) | ✅ |
| Parent role: `SelectedChildContext` + `ChildSwitcher` | ✅ |
| Module pages ported (16 modules, 131 module files) | ✅ |
| Role-area page wrappers ported (98 pages) | ✅ |
| Landing page (full marketing sections) | ✅ |
| AI assistant component | ✅ (UI only — backend mocked) |
| Live class / live exam screens | ✅ |
| `super-admin-app` | ⏭️ Out of scope (empty in source) |

Total TypeScript files in `src/`: **325**.

## Quick start

```bash
npm install
npm run msw:init      # one-time
npm run dev           # http://localhost:3000
```

Sign in with any email + password. Pick a role on the login screen — the
mock backend issues a real-shaped JWT and routes you to that role's
dashboard.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (port 3000, MSW mocks on by default) |
| `npm run build` | Type-check (`tsc -b`) + `vite build` to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` / `npm run lint` | TypeScript-only project check |
| `npm run msw:init` | Refresh `public/mockServiceWorker.js` (after MSW upgrades) |

Porting / regeneration scripts (used during initial migration):

| Command | Purpose |
| --- | --- |
| `node scripts/port-modules.mjs` | Re-port `modules/` and shared components from `old-app/school-app`, applying the standard transformations. Idempotent. |
| `node scripts/port-app-pages.mjs` | Re-port `app/<role>/<segments>/page.tsx` files into `src/pages/role/...`. Idempotent. |
| `node scripts/gen-routes.mjs` | Regenerate `src/routes/generated-routes.tsx` from the current `src/pages/role/...` tree. Run after porting new pages. |

## Environment

`.env`:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=        # set to http://localhost:8080 once Go is up
VITE_ENABLE_MOCKS=true        # set to false to skip MSW
```

When `VITE_API_PROXY_TARGET` is set, Vite proxies every `/api/*` request to
the Go backend. When it's empty and `VITE_ENABLE_MOCKS=true`, MSW serves
mock responses in-browser. The frontend code does not change in either mode.

## Architecture

```
src/
  app/globals.css                # Tailwind 4 + theme + premium-card utilities
  config/                        # env, RBAC matrix
  contexts/                      # SelectedChildContext (parent role)
  components/
    ui/                          # All shared UI primitives (Button, DataTable, Toast, …)
    parent/                      # ChildSwitcher
    landing/                     # 14 marketing sections
    auth/                        # InteractiveCharacters
    dashboard/                   # DashboardDrawer
    ai/                          # AIAssistant
    live-class/, live-classes/, live-exams/
  hooks/                         # useAuth, useTenantContext, useSafeAsync, useStudents, …
  layouts/                       # SchoolShell (sidebar + header + AY switcher + AI)
  lib/                           # tanstack/react-query client, design-tokens
  mocks/                         # MSW handlers + in-memory db
  modules/                       # Ported business modules (16 domains)
  pages/
    HomePage.tsx                 # Public landing
    auth/                        # AuthLayout, LoginPage, SignupPage
    role/                        # 98 role-area page wrappers
  providers/                     # QueryProvider
  routes/
    index.tsx                    # Master route table
    generated-routes.tsx         # Auto-generated route entries
    ProtectedRoute.tsx           # Role-based guard
  services/                      # service-client, academic-year-context
  types/                         # core, auth (mirrors old shared/types/core.ts)
  utils/                         # toast, jwt, error-handler, auth-cache
```

## Multi-tenant invariants preserved

| Invariant | Where enforced |
| --- | --- |
| `school_id` baked into JWT | mock `/api/auth/login` + future Go backend |
| Cross-tenant cache wipe on school switch | `useAuth` `enforceSchoolBoundary` |
| Academic year mirrored in JWT + header | `SchoolShell` switcher + `serviceRequest` |
| Tenant-scoped React Query keys | `tenantQueryKey()` in `lib/query-client.ts` |
| 401 → redirect to /auth/login | `serviceRequest` `handleUnauthorized` |
| Role-based route gating | `ProtectedRoute` |

## Migration roadmap

1. **Phase 1** — Frontend recreation, mocks, route table. ✅
2. **Phase 1.5** — Port all module bodies + role-area pages. ✅ (this phase)
3. **Phase 2** — Go backend implementing the same endpoints. Flip
   `VITE_API_PROXY_TARGET` to point at it and disable MSW.
4. **Phase 3** — PostgreSQL migrations + production hardening.

When the Go backend goes live, this frontend should not need edits beyond
removing MSW; every endpoint, every header, every response shape is
expected to match the contract that the original Node backend already used.

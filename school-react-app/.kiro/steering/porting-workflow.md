---
inclusion: manual
---

# Porting workflow — old-app → school-react-app

This guide is the canonical procedure for moving a feature from
`/Users/butt/Desktop/eduplexo/old-app/school-app` into the new React + Vite
project at `/Users/butt/Desktop/eduplexo/school-react-app`.

Read it whenever you (or the agent) is about to port a module, a page, or a
component.

## Ground rules

1. **No business-logic changes.** Endpoints, request shapes, response shapes,
   query parameter names, and side effects must match the original.
2. **No UI redesigns.** Pixel-, copy-, and class-name parity is the bar.
   If the original has a typo, keep the typo.
3. **No SSR-only assumptions.** Every page in the original is `"use client"`,
   so this is rarely a problem; if you encounter one that isn't, treat it as
   a Phase 1 failure condition and stop.
4. **Mocks are a means, not a goal.** When you port a module, update the
   relevant MSW handler so its mock data still satisfies the page's
   assumptions (filters, pagination, etc.).

## Standard transformations

These are the only edits you should need when porting most files.

| Original | Replacement |
| --- | --- |
| `import Link from "next/link"` | `import { Link } from "react-router-dom"` |
| `<Link href=…>` | `<Link to=…>` |
| `import { useRouter, usePathname } from "next/navigation"` | `import { useLocation, useNavigate } from "react-router-dom"` |
| `const router = useRouter()` | `const navigate = useNavigate()` |
| `router.push("/x")` / `router.replace("/x")` | `navigate("/x")` / `navigate("/x", { replace: true })` |
| `usePathname()` | `useLocation().pathname` |
| `"use client"` directive | Delete it |
| `import { … } from "@edu/shared/…"` | Replace with the local equivalent in `src/types`, `src/config`, etc. (see `src/types/core.ts` for what's already ported). |

## Porting a module — step by step

Take `students` as the worked example.

1. **Copy module files**
   ```
   src/modules/students/
   ├── components/StudentEditSidebar.tsx
   ├── components/StudentForm.tsx
   ├── components/StudentTable.tsx
   ├── constants/student.constants.ts
   ├── hooks/useStudents.ts
   ├── pages/StudentCreatePage.tsx
   ├── pages/StudentListPage.tsx
   ├── pages/StudentsPage.tsx
   ├── services/student.service.ts
   ├── types/student.types.ts
   └── validators/student.validator.ts
   ```

2. **Apply standard transformations** to every file.

3. **Resolve `@edu/shared` imports**
   - `@edu/shared/types/core` → `@/types/core`
   - `@edu/shared/auth/rbac` → `@/config/rbac`
   - Validation schemas (zod) — port the schema file under
     `src/modules/students/validators/` or extract to `src/types/`.

4. **Wire the route**
   Open `src/routes/index.tsx`, find the placeholder for `/admin/students`,
   replace with:
   ```tsx
   import { StudentListPage } from "@/modules/students/pages/StudentListPage";
   import { SchoolShell } from "@/layouts/SchoolShell";
   …
   {
     path: "/admin/students",
     element: (
       <SchoolShell eyebrow="Operations" title="Student Records">
         <StudentListPage />
       </SchoolShell>
     ),
   },
   ```

5. **Update the mock**
   Adjust `src/mocks/handlers/students.ts` if the real page expects more
   fields or different filter semantics.

6. **Verify**
   - `npm run check` — no TS errors.
   - `npm run dev` — page renders, network tab shows the right `/api/*`
     call, response is shaped correctly, page handles loading/empty/error
     states identically to the original.

## Failure conditions

Stop and surface the issue when:

- The original page imports a Next.js-only API not listed in the
  transformations table (e.g. `next/headers`, `next/font`, server actions).
- A module depends on a backend service whose Mongo query has no SQL-friendly
  equivalent that's already been planned.
- The original page reads cookies or environment variables on the server
  side; that flow must move into the Go backend before being recreated here.

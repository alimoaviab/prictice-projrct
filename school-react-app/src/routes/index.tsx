/**
 * Master route table.
 *
 * Routes are sourced from `generated-routes.tsx`, which is auto-produced from
 * the porting scripts (see `scripts/gen-routes.mjs`). Each entry imports a
 * real ported page from `src/pages/role/<role>/...` and renders it under the
 * appropriate role-guarded `<ProtectedRoute>`.
 *
 * Public routes (landing, /auth/*) live here; the dashboards and module pages
 * live in `generated-routes.tsx`.
 */

import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "@/App";
import { HomePage } from "@/pages/HomePage";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { ProtectedRoute } from "./ProtectedRoute";
import {
  adminRoutes,
  teacherRoutes,
  parentRoutes,
  studentRoutes,
} from "./generated-routes";

// Tests Imports
import { AdminTestsPage } from "@/pages/role/admin/tests";
import { AdminTestCreatePage } from "@/pages/role/admin/tests/create";
import { AdminTestMarksPage } from "@/pages/role/admin/tests/marks";
import { TeacherTestsPage } from "@/pages/role/teacher/tests";
import { TeacherTestCreatePage } from "@/pages/role/teacher/tests/create";
import { TeacherTestMarksPage } from "@/pages/role/teacher/tests/marks";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      // ─── Public ────────────────────────────────────────────────────────
      { path: "/", element: <HomePage /> },

      // ─── Auth ──────────────────────────────────────────────────────────
      {
        path: "/auth",
        element: <AuthLayout />,
        children: [
          { index: true, element: <Navigate to="/auth/login" replace /> },
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignupPage /> },
        ],
      },

      // ─── Admin ─────────────────────────────────────────────────────────
      {
        element: <ProtectedRoute allowedRoles={["admin", "super_admin"]} />,
        children: [
          { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
          ...adminRoutes,
          { path: "/admin/tests", element: <AdminTestsPage /> },
          { path: "/admin/tests/create", element: <AdminTestCreatePage /> },
          { path: "/admin/tests/marks", element: <AdminTestMarksPage /> },
        ],
      },

      // ─── Teacher ───────────────────────────────────────────────────────
      {
        element: <ProtectedRoute allowedRoles={["teacher"]} />,
        children: [
          { path: "/teacher", element: <Navigate to="/teacher/dashboard" replace /> },
          ...teacherRoutes,
          { path: "/teacher/tests", element: <TeacherTestsPage /> },
          { path: "/teacher/tests/create", element: <TeacherTestCreatePage /> },
          { path: "/teacher/tests/marks", element: <TeacherTestMarksPage /> },
        ],
      },

      // ─── Parent ────────────────────────────────────────────────────────
      {
        element: <ProtectedRoute allowedRoles={["parent"]} />,
        children: [
          { path: "/parent", element: <Navigate to="/parent/dashboard" replace /> },
          ...parentRoutes,
        ],
      },

      // ─── Student ───────────────────────────────────────────────────────
      {
        element: <ProtectedRoute allowedRoles={["student"]} />,
        children: [
          { path: "/student", element: <Navigate to="/student/dashboard" replace /> },
          ...studentRoutes,
        ],
      },

      // ─── Catch-all ─────────────────────────────────────────────────────
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

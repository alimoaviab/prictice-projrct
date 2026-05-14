/**
 * Master route table with code splitting.
 *
 * All module pages are lazy-loaded via generated-routes.tsx. Only the shell
 * (App), auth pages, and the router itself are in the initial bundle.
 *
 * Initial bundle: ~180KB (down from ~800KB with eager imports).
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "@/App";
import { PageLoader } from "@/components/PageLoader";
import { ProtectedRoute } from "./ProtectedRoute";
import {
  adminRoutes,
  teacherRoutes,
  parentRoutes,
  studentRoutes,
} from "./generated-routes";

// Auth pages are small and critical-path — keep them eager
import { HomePage } from "@/pages/HomePage";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";

// Tests pages — lazy loaded
const AdminTestsPage = lazy(() => import("@/pages/role/admin/tests").then(m => ({ default: m.AdminTestsPage })));
const AdminTestCreatePage = lazy(() => import("@/pages/role/admin/tests/create").then(m => ({ default: m.AdminTestCreatePage })));
const AdminTestMarksPage = lazy(() => import("@/pages/role/admin/tests/marks").then(m => ({ default: m.AdminTestMarksPage })));
const TeacherTestsPage = lazy(() => import("@/pages/role/teacher/tests").then(m => ({ default: m.TeacherTestsPage })));
const TeacherTestCreatePage = lazy(() => import("@/pages/role/teacher/tests/create").then(m => ({ default: m.TeacherTestCreatePage })));
const TeacherTestMarksPage = lazy(() => import("@/pages/role/teacher/tests/marks").then(m => ({ default: m.TeacherTestMarksPage })));

function suspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

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
          { path: "/admin/tests", element: suspense(AdminTestsPage) },
          { path: "/admin/tests/create", element: suspense(AdminTestCreatePage) },
          { path: "/admin/tests/marks", element: suspense(AdminTestMarksPage) },
        ],
      },

      // ─── Teacher ───────────────────────────────────────────────────────
      {
        element: <ProtectedRoute allowedRoles={["teacher"]} />,
        children: [
          { path: "/teacher", element: <Navigate to="/teacher/dashboard" replace /> },
          ...teacherRoutes,
          { path: "/teacher/tests", element: suspense(TeacherTestsPage) },
          { path: "/teacher/tests/create", element: suspense(TeacherTestCreatePage) },
          { path: "/teacher/tests/marks", element: suspense(TeacherTestMarksPage) },
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

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SchoolsPage } from './pages/SchoolsPage'
import { SchoolDetailPage } from './pages/SchoolDetailPage'
import { PlansPage } from './pages/PlansPage'
import { UsersPage } from './pages/UsersPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/schools', element: <SchoolsPage /> },
      { path: '/schools/:id', element: <SchoolDetailPage /> },
      { path: '/plans', element: <PlansPage /> },
      { path: '/users', element: <UsersPage /> },
    ],
  },
])

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SchoolsPage } from './pages/SchoolsPage'
import { SchoolDetailPage } from './pages/SchoolDetailPage'
import { PlansPage } from './pages/PlansPage'
import { UsersPage } from './pages/UsersPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { FinanceDashboardPage } from './pages/FinanceDashboardPage'
import { PackagesPage } from './pages/PackagesPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { ModerationPage } from './pages/ModerationPage'

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
      { path: '/payments', element: <PaymentsPage /> },
      { path: '/finance', element: <FinanceDashboardPage /> },
      { path: '/packages', element: <PackagesPage /> },
      { path: '/expenses', element: <ExpensesPage /> },
      { path: '/moderation', element: <ModerationPage /> },
    ],
  },
])

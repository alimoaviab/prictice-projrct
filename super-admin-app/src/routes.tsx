import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { SchoolsPage } from './pages/SchoolsPage'
import { SchoolDetailPage } from './pages/SchoolDetailPage'
import { UsersPage } from './pages/UsersPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { PackagesPage } from './pages/PackagesPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { SettingsPage } from './pages/SettingsPage'
import { AIUsagePage } from './pages/AIUsagePage'
import { ModerationPage } from './pages/ModerationPage'
import { GlobalQuestionBankPage } from './pages/GlobalQuestionBankPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/schools', element: <SchoolsPage /> },
      { path: '/schools/:id', element: <SchoolDetailPage /> },
      { path: '/users', element: <UsersPage /> },
      { path: '/payments', element: <PaymentsPage /> },
      { path: '/packages', element: <PackagesPage /> },
      { path: '/subscriptions', element: <SubscriptionsPage /> },
      { path: '/ai-usage', element: <AIUsagePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/moderation', element: <ModerationPage /> },
      { path: '/question-bank', element: <GlobalQuestionBankPage /> },
    ],
  },
])

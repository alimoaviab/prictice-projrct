import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

interface FinanceStats {
  total_revenue: number
  monthly_revenue: number
  total_expenses: number
  net_profit: number
  expense_breakdown: {
    mutual: number
    ali: number
    abdul_rehman: number
  }
  total_schools: number
  active_packages: number
}

export function FinanceDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { apiRequest } = await import('../lib/api')
        const response = await apiRequest('/api/super-admin/finance/dashboard')

        if (!response.ok) {
          throw new Error(response.message || 'Failed to fetch finance stats')
        }

        setStats(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  if (!stats) {
    return <div>No data available</div>
  }

  const cards = [
    {
      label: 'Total Revenue',
      value: `$${stats.total_revenue.toFixed(2)}`,
      icon: 'trending_up',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats.monthly_revenue.toFixed(2)}`,
      icon: 'calendar_month',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Expenses',
      value: `$${stats.total_expenses.toFixed(2)}`,
      icon: 'trending_down',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Net Profit',
      value: `$${stats.net_profit.toFixed(2)}`,
      icon: 'account_balance',
      color: `${stats.net_profit >= 0 ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'}`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Dashboard"
        description="Monitor revenue, expenses, and profitability"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg ${card.color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-lg">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-600">Mutual Expenses</span>
              </div>
              <span className="font-semibold text-slate-900">
                ${stats.expense_breakdown.mutual.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-sm text-slate-600">Ali Expenses</span>
              </div>
              <span className="font-semibold text-slate-900">
                ${stats.expense_breakdown.ali.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm text-slate-600">Abdul Rehman Expenses</span>
              </div>
              <span className="font-semibold text-slate-900">
                ${stats.expense_breakdown.abdul_rehman.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Schools</span>
              <span className="font-semibold text-slate-900">{stats.total_schools}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active Packages</span>
              <span className="font-semibold text-slate-900">{stats.active_packages}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-sm font-medium text-slate-700">Profit Margin</span>
              <span className="font-semibold text-slate-900">
                {stats.total_revenue > 0
                  ? ((stats.net_profit / stats.total_revenue) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/packages')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Manage Packages
          </button>
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Expense
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm"
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  )
}

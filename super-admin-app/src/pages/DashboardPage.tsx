import { AppIcon } from "shared/ui/AppIcon";
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/lib/api'

interface DashboardData {
  schools: {
    total: number
    active: number
    pending: number
    suspended: number
    expired: number
    trial: number
    paid: number
    new_this_month: number
    new_last_month: number
    growth_rate: number
  }
  revenue: {
    total: number
    monthly: number
    mrr: number
    arr: number
    collected: number
    pending: number
    collection_rate: number
    renewals_due: number
  }
  subscriptions: {
    active: number
    expired: number
    churn_rate: number
  }
  platform: {
    total_users: number
    admin_users: number
    total_expenses: number
    net_revenue: number
    expense_breakdown: Record<string, number>
  }
  monthly_growth: { month: string; schools: number; revenue: number }[]
  plan_distribution: Record<string, number>
  recent_schools: { _id: string; name: string; plan: string; status: string; revenue: number; expiry: string; created_at: string }[]
  recent_payments: { school: string; amount: number; plan: string; status: string; date: string }[]
  activities: { type: string; message: string; timestamp: string }[]
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `Rs ${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}K`
  return `Rs ${amount.toLocaleString()}`
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [packagesCount, setPackagesCount] = useState(0)
  const [activePackages, setActivePackages] = useState(0)
  const [subsCount, setSubsCount] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)
  const [aiUsage, setAiUsage] = useState(0)

  useEffect(() => {
    loadDashboard()
    loadExtraMetrics()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    const result = await apiRequest<DashboardData>('/api/super-admin/dashboard')
    if (result.ok && result.data) {
      setData(result.data)
    }
    setLoading(false)
  }

  async function loadExtraMetrics() {
    const [pkgRes, subRes, payRes, aiRes] = await Promise.all([
      apiRequest('/api/super-admin/packages'),
      apiRequest('/api/super-admin/subscriptions'),
      apiRequest('/api/admin/payments/pending'),
      apiRequest('/api/super-admin/ai-usage'),
    ])
    if (pkgRes.ok && pkgRes.data) {
      const d = pkgRes.data as any
      const items = d.items || []
      setPackagesCount(items.length)
      setActivePackages(items.filter((p: any) => p.status === 'active').length)
    }
    if (subRes.ok && subRes.data) {
      const d = subRes.data as any
      setSubsCount((d.items || []).length)
    }
    if (payRes.ok && payRes.data) {
      const d = payRes.data as any
      setPendingPayments((d.items || d.data || []).length)
    }
    if (aiRes.ok && aiRes.data) {
      const d = aiRes.data as any
      const total = (d.items || []).reduce((a: number, u: any) => a + (u.chatbot_used || 0), 0)
      setAiUsage(total)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  if (!data) return null

  const { schools, revenue, subscriptions, platform, monthly_growth, plan_distribution, recent_schools, recent_payments, activities } = data

  // ── KPI Cards ──────────────────────────────────────────────────────────

  const schoolKPIs = [
    { label: 'Total Schools', value: schools.total, icon: 'business', trend: schools.growth_rate },
    { label: 'Active', value: schools.active, icon: 'check_circle', color: 'text-emerald-600' },
    { label: 'Pending Approval', value: schools.pending, icon: 'pending', color: 'text-amber-600' },
    { label: 'Suspended', value: schools.suspended, icon: 'block', color: 'text-red-600' },
    { label: 'Trial Schools', value: schools.trial, icon: 'experiment', color: 'text-blue-600' },
    { label: 'Paid Schools', value: schools.paid, icon: 'payments', color: 'text-blue-600' },
    { label: 'Expired', value: schools.expired, icon: 'schedule', color: 'text-slate-500' },
  ]

  const revenueKPIs = [
    { label: 'MRR', value: formatCurrency(revenue.mrr), icon: 'trending_up' },
    { label: 'ARR', value: formatCurrency(revenue.arr), icon: 'account_balance' },
    { label: 'Revenue Today', value: formatCurrency(revenue.monthly), icon: 'today' },
    { label: 'Pending Payments', value: formatCurrency(revenue.pending), icon: 'hourglass_empty', color: 'text-amber-600' },
    { label: 'Renewals Due', value: revenue.renewals_due, icon: 'event_busy', color: 'text-amber-600' },
    { label: 'Collection Rate', value: `${revenue.collection_rate.toFixed(1)}%`, icon: 'savings' },
  ]

  const subscriptionKPIs = [
    { label: 'Active Plans', value: subscriptions.active, icon: 'check_circle', color: 'text-emerald-600' },
    { label: 'Platform Users', value: platform.total_users, icon: 'group' },
    { label: 'New This Month', value: schools.new_this_month, icon: 'add_circle', color: 'text-emerald-600' },
    { label: 'Growth', value: `${schools.growth_rate.toFixed(1)}%`, icon: 'trending_up', color: schools.growth_rate >= 0 ? 'text-emerald-600' : 'text-red-600' },
    { label: 'Churn Rate', value: `${subscriptions.churn_rate.toFixed(1)}%`, icon: 'trending_down', color: subscriptions.churn_rate > 5 ? 'text-red-600' : 'text-emerald-600' },
  ]

  // ── Plan Distribution ──────────────────────────────────────────────────

  const totalPlanSchools = Object.values(plan_distribution).reduce((a, b) => a + b, 0)
  const planColors: Record<string, string> = {
    'Basic': 'bg-blue-600',
    'Pro': 'bg-indigo-600',
    'Enterprise': 'bg-slate-800',
    'Free': 'bg-slate-300',
  }

  // ── Quick Actions ──────────────────────────────────────────────────────

  const quickActions = [
    { label: 'Add School', icon: 'add_business', href: '/schools' },
    { label: 'Packages', icon: 'inventory_2', href: '/packages' },
    { label: 'Subscriptions', icon: 'card_membership', href: '/subscriptions' },
    { label: 'Payments', icon: 'payments', href: '/payments' },
    { label: 'AI Usage', icon: 'smart_toy', href: '/ai-usage' },
    { label: 'Settings', icon: 'settings', href: '/settings' },
    { label: 'Users', icon: 'manage_accounts', href: '/users' },
  ]

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Platform Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">EduPlexo — Multi-Tenant Business Operations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last updated: {new Date().toLocaleTimeString()}</span>
          <button onClick={loadDashboard} className="h-7 px-3 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* ── ROW 1: School KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {schoolKPIs.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AppIcon name={kpi.icon} size={14} className={` ${kpi.color || 'text-blue-600'} `} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900">{formatNumber(kpi.value)}</span>
              {kpi.trend !== undefined && kpi.trend !== 0 && (
                <span className={`text-[9px] font-bold ${kpi.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.trend >= 0 ? '↑' : '↓'} {Math.abs(kpi.trend).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: Revenue KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {revenueKPIs.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AppIcon name={kpi.icon} size={14} className={` ${kpi.color || 'text-blue-600'} `} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* ── ROW 3: Subscription KPIs ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {subscriptionKPIs.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AppIcon name={kpi.icon} size={14} className={` ${kpi.color || 'text-blue-600'} `} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* ── ROW 4: Business Metrics ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Packages', value: packagesCount, icon: 'inventory_2', color: 'text-blue-600' },
          { label: 'Active Packages', value: activePackages, icon: 'check_circle', color: 'text-blue-600' },
          { label: 'Subscriptions', value: subsCount, icon: 'card_membership', color: 'text-blue-600' },
          { label: 'Pending Payments', value: pendingPayments, icon: 'hourglass_empty', color: 'text-amber-600' },
          { label: 'AI Messages Used', value: aiUsage.toLocaleString(), icon: 'smart_toy', color: 'text-blue-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AppIcon name={kpi.icon} size={14} className={` ${kpi.color} `} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT GRID ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT: Charts ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* School Growth Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">School Growth</h3>
            <div className="flex items-end gap-2 h-32">
              {monthly_growth.map((m, i) => {
                const maxSchools = Math.max(...monthly_growth.map(x => x.schools), 1)
                const height = Math.max((m.schools / maxSchools) * 100, 4)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-600">{m.schools}</span>
                    <div className="w-full bg-blue-600 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-[9px] text-slate-400">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Revenue Trend</h3>
            <div className="flex items-end gap-2 h-32">
              {monthly_growth.map((m, i) => {
                const maxRev = Math.max(...monthly_growth.map(x => x.revenue), 1)
                const height = Math.max((m.revenue / maxRev) * 100, 4)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-600">{formatCurrency(m.revenue)}</span>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-[9px] text-slate-400">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Subscription Distribution</h3>
            <div className="space-y-3">
              {Object.entries(plan_distribution).map(([plan, count]) => {
                const pct = totalPlanSchools > 0 ? (count / totalPlanSchools) * 100 : 0
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${planColors[plan] || 'bg-slate-400'}`} />
                    <span className="text-xs font-medium text-slate-700 w-24">{plan}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${planColors[plan] || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-900 w-12 text-right">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                )
              })}
              {totalPlanSchools === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No subscription data yet</p>
              )}
            </div>
          </div>

          {/* Finance Panel */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Finance Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Revenue</span>
                <p className="text-base font-bold text-slate-900 mt-1">{formatCurrency(revenue.total)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Collected</span>
                <p className="text-base font-bold text-emerald-600 mt-1">{formatCurrency(revenue.collected)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Pending</span>
                <p className="text-base font-bold text-amber-600 mt-1">{formatCurrency(revenue.pending)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Net Revenue</span>
                <p className="text-base font-bold text-slate-900 mt-1">{formatCurrency(platform.net_revenue)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Expenses</span>
                <p className="text-base font-bold text-red-600 mt-1">{formatCurrency(platform.total_expenses)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">MRR</span>
                <p className="text-base font-bold text-blue-600 mt-1">{formatCurrency(revenue.mrr)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">ARR</span>
                <p className="text-base font-bold text-blue-600 mt-1">{formatCurrency(revenue.arr)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Renewals Due</span>
                <p className="text-base font-bold text-amber-600 mt-1">{revenue.renewals_due}</p>
              </div>
            </div>
            {/* Expense Breakdown */}
            {Object.keys(platform.expense_breakdown).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Expense Breakdown</span>
                <div className="flex gap-4 mt-2">
                  {Object.entries(platform.expense_breakdown).map(([type, amount]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-600 capitalize">{type}:</span>
                      <span className="text-[10px] font-bold text-slate-900">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─ RIGHT: Activity + Quick Actions ───────────────────────────── */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-left"
                >
                  <AppIcon name={action.icon} size={14} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Recent Activity</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {activities.map((activity, i) => {
                const iconMap: Record<string, string> = {
                  school_joined: 'business',
                  payment_received: 'payments',
                  plan_upgraded: 'upgrade',
                  plan_expired: 'event_busy',
                  school_suspended: 'block',
                  renewal_completed: 'check_circle',
                }
                const colorMap: Record<string, string> = {
                  school_joined: 'text-emerald-600',
                  payment_received: 'text-blue-600',
                  plan_upgraded: 'text-indigo-600',
                  plan_expired: 'text-red-600',
                  school_suspended: 'text-amber-600',
                  renewal_completed: 'text-emerald-600',
                }
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <AppIcon name={iconMap[activity.type] || 'info'} size={14} className={` mt-0.5 ${colorMap[activity.type] || 'text-slate-400'} `} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-700 leading-snug">{activity.message}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              {activities.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─ TABLES SECTION ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Latest Schools */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Latest Schools</h3>
            <button onClick={() => navigate('/schools')} className="text-[10px] font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">School</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Plan</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase text-right">Revenue</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {recent_schools.map((school) => {
                  const statusColors: Record<string, string> = {
                    active: 'bg-emerald-50 text-emerald-700',
                    pending: 'bg-amber-50 text-amber-700',
                    suspended: 'bg-red-50 text-red-700',
                    expired: 'bg-slate-50 text-slate-600',
                  }
                  return (
                    <tr key={school._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-medium text-slate-900">{school.name}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold text-slate-600">{school.plan}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[school.status] || 'bg-slate-50 text-slate-600'}`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[11px] font-bold text-slate-900">{formatCurrency(school.revenue)}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] text-slate-500">
                          {school.expiry ? new Date(school.expiry).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {recent_schools.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">No schools yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Payments */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Latest Payments</h3>
            <button onClick={() => navigate('/payments')} className="text-[10px] font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">School</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Plan</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_payments.map((payment, i) => {
                  const statusColors: Record<string, string> = {
                    paid: 'bg-emerald-50 text-emerald-700',
                    pending: 'bg-amber-50 text-amber-700',
                    overdue: 'bg-red-50 text-red-700',
                    cancelled: 'bg-slate-50 text-slate-600',
                  }
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-medium text-slate-900">{payment.school || 'Unknown'}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] font-bold text-slate-900">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold text-slate-600">{payment.plan}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[payment.status] || 'bg-slate-50 text-slate-600'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] text-slate-500">{new Date(payment.date).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  )
                })}
                {recent_payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">No payments yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

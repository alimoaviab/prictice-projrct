import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface DashboardData {
  schools: { total: number; active: number; suspended: number; pending: number }
  users: { total_students: number; total_teachers: number; total_classes: number; total_users: number }
  revenue: { total: number; monthly: number }
  subscriptions: { active: number; trial: number; expired: number; expiring: number }
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest<DashboardData>('/api/super-admin/dashboard').then((res) => {
      if (res.ok && res.data) setData(res.data as any)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Schools', value: data?.schools.total || 0, icon: 'apartment', color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Schools', value: data?.schools.active || 0, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Suspended', value: data?.schools.suspended || 0, icon: 'block', color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Pending Approval', value: data?.schools.pending || 0, icon: 'hourglass_empty', color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Total Students', value: data?.users.total_students || 0, icon: 'school', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Total Teachers', value: data?.users.total_teachers || 0, icon: 'badge', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { label: 'Total Classes', value: data?.users.total_classes || 0, icon: 'door_front', color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Monthly Revenue', value: `Rs ${(data?.revenue.monthly || 0).toLocaleString()}`, icon: 'trending_up', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of the entire Eduplexo platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`h-11 w-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Subscriptions</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active</span>
              <span className="text-sm font-bold text-emerald-600">{data?.subscriptions.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Trial</span>
              <span className="text-sm font-bold text-blue-600">{data?.subscriptions.trial || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Expired</span>
              <span className="text-sm font-bold text-red-600">{data?.subscriptions.expired || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Expiring Soon</span>
              <span className="text-sm font-bold text-amber-600">{data?.subscriptions.expiring || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Revenue</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Revenue</span>
              <span className="text-sm font-bold text-slate-900">Rs {(data?.revenue.total || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">This Month</span>
              <span className="text-sm font-bold text-emerald-600">Rs {(data?.revenue.monthly || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Users</span>
              <span className="text-sm font-bold text-slate-900">{data?.users.total_users || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

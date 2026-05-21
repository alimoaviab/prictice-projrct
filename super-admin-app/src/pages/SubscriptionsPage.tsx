import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface Subscription {
  _id: string
  school_id: string
  school_name: string
  package_id: string
  package_name: string
  status: string
  auto_renew: boolean
  next_renewal: string
  created_at: string
}

export function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    apiRequest('/api/super-admin/subscriptions').then((res) => {
      if (res.ok && res.data) {
        const d = res.data as any
        setSubs(d.items || [])
      }
      setLoading(false)
    })
  }, [])

  const filtered = subs.filter((s) => filter === 'all' || s.status === filter)

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-blue-50 text-blue-700 border-blue-100',
      expired: 'bg-slate-50 text-slate-500 border-slate-100',
      trial: 'bg-amber-50 text-amber-700 border-amber-100',
      cancelled: 'bg-red-50 text-red-700 border-red-100',
    }
    return `text-[9px] font-bold px-2 py-0.5 rounded-full border ${map[s] || map.expired}`
  }

  const activeCount = subs.filter(s => s.status === 'active').length
  const expiredCount = subs.filter(s => s.status === 'expired').length
  const trialCount = subs.filter(s => s.status === 'trial').length

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage school subscriptions and renewals</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: subs.length, icon: 'card_membership', color: 'text-blue-600' },
          { label: 'Active', value: activeCount, icon: 'check_circle', color: 'text-blue-600' },
          { label: 'Expired', value: expiredCount, icon: 'schedule', color: 'text-slate-600' },
          { label: 'Trial', value: trialCount, icon: 'free_breakfast', color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-[16px] ${s.color}`}>{s.icon}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5">
          {(['all', 'active', 'expired', 'trial', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-7 px-3 rounded-md text-[11px] font-semibold transition-colors ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading subscriptions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">card_membership</span>
            <p className="text-sm font-medium text-slate-500">No subscriptions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">School</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Package</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Auto Renew</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Next Renewal</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((sub) => (
                <tr key={sub._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-semibold text-slate-900">{sub.school_name || sub.school_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-medium text-slate-700">{sub.package_name || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={statusBadge(sub.status)}>{sub.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold ${sub.auto_renew ? 'text-blue-600' : 'text-slate-400'}`}>
                      {sub.auto_renew ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate-500">
                      {sub.next_renewal ? new Date(sub.next_renewal).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate-500">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

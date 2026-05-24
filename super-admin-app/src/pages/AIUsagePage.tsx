import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface AIUsage {
  school_id: string
  school_name: string
  admin_email: string
  admin_password: string
  package_name: string
  chatbot_limit: number
  chatbot_used: number
  chatbot_remaining: number
  usage_percent: number
}

export function AIUsagePage() {
  const [usage, setUsage] = useState<AIUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiRequest('/api/super-admin/ai-usage').then((res) => {
      if (res.ok && res.data) {
        const d = res.data as any
        setUsage(d.items || [])
      }
      setLoading(false)
    })
  }, [])

  const filtered = usage.filter((u) => !search || u.school_name.toLowerCase().includes(search.toLowerCase()))

  const totalUsed = usage.reduce((a, u) => a + u.chatbot_used, 0)
  const totalLimit = usage.reduce((a, u) => a + u.chatbot_limit, 0)
  const overLimit = usage.filter(u => u.chatbot_used > u.chatbot_limit).length

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Usage</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitor chatbot and AI usage across schools</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Used', value: totalUsed.toLocaleString(), icon: 'smart_toy', color: 'text-blue-600' },
          { label: 'Total Limit', value: totalLimit.toLocaleString(), icon: 'speed', color: 'text-slate-600' },
          { label: 'Over Limit', value: overLimit, icon: 'warning', color: overLimit > 0 ? 'text-red-600' : 'text-slate-600' },
          { label: 'Schools', value: usage.length, icon: 'school', color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AppIcon name={s.icon} size={16} className={` text-[16px] ${s.color} `} />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-xs">
          <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools..."
            className="w-full h-8 pl-9 pr-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading AI usage...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <AppIcon name="Bot" size={36} className="text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No usage data found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">School</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Admin Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Package</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Used</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Limit</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Remaining</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => {
                const pct = u.chatbot_limit > 0 ? Math.min(u.usage_percent, 100) : 0
                const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                return (
                  <tr key={u.school_id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-slate-900">{u.school_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-medium text-slate-700">{u.admin_email || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium text-slate-700">{u.package_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[11px] font-bold text-slate-900">{u.chatbot_used.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[11px] text-slate-500">{u.chatbot_limit.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-bold ${u.chatbot_remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {u.chatbot_remaining.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

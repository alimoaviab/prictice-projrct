import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface PaymentRequest {
  id: string
  school_name: string
  plan_name: string
  amount: number
  status: string
  transaction_id: string
  screenshot_url: string
  notes: string
  submitted_at: string
  verified_at?: string
  rejection_reason?: string
}

export function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const res = await apiRequest('/api/admin/payments/all')
    if (res.ok && res.data) {
      const d = res.data as any
      setPayments(d.items || d.data || [])
    }
    setLoading(false)
  }

  const handleVerify = async (id: string) => {
    const res = await apiRequest(`/api/admin/payments/${id}/verify`, { method: 'POST' })
    if (res.ok) fetchPayments()
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason === null) return
    const res = await apiRequest(`/api/admin/payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
    if (res.ok) fetchPayments()
  }

  const filtered = payments.filter((p) => {
    if (tab === 'pending') return p.status === 'pending'
    if (tab === 'approved') return p.status === 'verified'
    return p.status === 'rejected'
  })

  const pendingCount = payments.filter(p => p.status === 'pending').length
  const approvedCount = payments.filter(p => p.status === 'verified').length
  const rejectedCount = payments.filter(p => p.status === 'rejected').length

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      verified: 'bg-blue-50 text-blue-700 border-blue-100',
      rejected: 'bg-red-50 text-red-700 border-red-100',
    }
    return `text-[9px] font-bold px-2 py-0.5 rounded-full border ${map[s] || map.pending}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">Verify and manage school subscription payments</p>
        </div>
        <button onClick={fetchPayments} className="h-8 px-3 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: pendingCount, icon: 'schedule', color: 'text-amber-600', tab: 'pending' as const },
          { label: 'Approved', value: approvedCount, icon: 'check_circle', color: 'text-blue-600', tab: 'approved' as const },
          { label: 'Rejected', value: rejectedCount, icon: 'cancel', color: 'text-red-600', tab: 'rejected' as const },
        ].map((s) => (
          <button key={s.label} onClick={() => setTab(s.tab)} className={`bg-white rounded-xl border p-4 text-left transition-colors ${tab === s.tab ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AppIcon name={s.icon} size={16} className={` text-[16px] ${s.color} `} />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <AppIcon name="CreditCard" size={36} className="text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No {tab} payments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">School</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Plan / Amount</th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Proof</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-semibold text-slate-900">{p.school_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.transaction_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[11px] font-semibold text-blue-600">{p.plan_name}</p>
                    <p className="text-[11px] font-bold text-slate-900">Rs {p.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={statusBadge(p.status)}>{p.status === 'verified' ? 'Approved' : p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {p.screenshot_url && (
                        <a href={p.screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline">
                          <AppIcon name="Image" size={14} />
                          Screenshot
                        </a>
                      )}
                      {p.notes && <p className="text-[10px] text-slate-500 italic line-clamp-1">"{p.notes}"</p>}
                      {p.rejection_reason && <p className="text-[10px] text-red-500">Rejected: {p.rejection_reason}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] text-slate-500">{new Date(p.submitted_at).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'pending' && (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleReject(p.id)} className="h-6 px-2.5 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
                          Reject
                        </button>
                        <button onClick={() => handleVerify(p.id)} className="h-6 px-2.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                          Verify
                        </button>
                      </div>
                    )}
                    {p.status !== 'pending' && (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
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

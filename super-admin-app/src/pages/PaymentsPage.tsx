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
}

export function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    const res = await apiRequest<PaymentRequest[]>('/api/admin/payments/pending')
    if (res.ok && res.data) {
      setPayments(res.data)
    }
    setLoading(false)
  }

  const handleVerify = async (id: string) => {
    if (!confirm('Are you sure you want to verify this payment? This will activate the school subscription.')) return
    const res = await apiRequest(`/api/admin/payments/${id}/verify`, { method: 'POST' })
    if (res.ok) {
      alert('Payment verified successfully!')
      fetchPayments()
    } else {
      alert(res.error?.message || 'Failed to verify payment')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason === null) return
    const res = await apiRequest(`/api/admin/payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
    if (res.ok) {
      alert('Payment rejected.')
      fetchPayments()
    } else {
      alert(res.error?.message || 'Failed to reject payment')
    }
  }

  if (loading) return <div className="p-8 text-center">Loading payments...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Review and verify payment proofs from schools</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">School</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan / Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proof</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No pending payments found.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{p.school_name}</p>
                    <p className="text-xs text-slate-500 font-mono">ID: {p.transaction_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-blue-600">{p.plan_name}</p>
                    <p className="text-sm text-slate-900 font-bold">Rs {p.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {p.screenshot_url && (
                        <a 
                          href={p.screenshot_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">image</span>
                          View Screenshot
                        </a>
                      )}
                      {p.notes && (
                        <div className="max-w-[200px]">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">SMS/Notes:</p>
                          <p className="text-[11px] text-slate-700 line-clamp-2 italic">"{p.notes}"</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(p.submitted_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleReject(p.id)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleVerify(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-100 transition-all"
                      >
                        Verify
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

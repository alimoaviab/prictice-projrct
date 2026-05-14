import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface Plan {
  id: string
  name: string
  slug: string
  billing_cycle: string
  price: number
  student_limit: number
  teacher_limit: number
  trial_days: number
  is_active: boolean
}

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/super-admin/plans').then((res) => {
      if (res.ok && res.data) setPlans(res.data as Plan[])
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
        <p className="text-sm text-slate-500 mt-1">Manage pricing plans for schools</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-900">Rs {plan.price.toLocaleString()}</span>
                <span className="text-sm text-slate-500 ml-1">/{plan.billing_cycle}</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Students</span>
                  <span className="font-semibold text-slate-900">Up to {plan.student_limit}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Teachers</span>
                  <span className="font-semibold text-slate-900">Up to {plan.teacher_limit}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Billing</span>
                  <span className="font-semibold text-slate-900 capitalize">{plan.billing_cycle}</span>
                </div>
                {plan.trial_days > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-600">Trial Period</span>
                    <span className="font-semibold text-blue-600">{plan.trial_days} days</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiRequest } from '@/lib/api'

interface SchoolDetail {
  _id: string
  school_id: string
  name: string
  code: string
  email: string
  phone: string
  address: string
  city: string
  principal_name: string
  website: string
  status: string
  owner_email: string
  owner_password: string
  student_count: number
  teacher_count: number
  class_count: number
  parent_count: number
  subject_count: number
  plan: string
  revenue: number
  expiry: string
  created_at: string
  updated_at: string
}

export function SchoolDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [school, setSchool] = useState<SchoolDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDetails = async () => {
    setLoading(true)
    const res = await apiRequest(`/api/super-admin/schools/${id}`)
    if (res.ok && res.data) {
      const s = res.data as SchoolDetail
      setSchool(s)
    }
    setLoading(false)
  }

  useEffect(() => { loadDetails() }, [id])

  const handleStatusChange = async (newStatus: string) => {
    const res = await apiRequest(`/api/super-admin/schools/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, reason: 'Admin action' })
    })
    if (res.ok) loadDetails()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AppIcon name="Loader2" size={30} className="text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 mt-2">Loading school details...</p>
      </div>
    </div>
  )
  if (!school) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AppIcon name="AlertCircle" size={30} className="text-red-400" />
        <p className="text-sm text-red-500 mt-2">School not found</p>
      </div>
    </div>
  )

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-blue-50 text-blue-700 border-blue-100',
      suspended: 'bg-red-50 text-red-700 border-red-100',
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      expired: 'bg-slate-50 text-slate-600 border-slate-100',
    }
    return `text-[10px] font-bold px-2.5 py-1 rounded-full border ${map[s] || map.expired}`
  }

  const initials = school.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/schools')}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{school.name}</h1>
              <p className="text-[11px] text-slate-500">ID: {school.school_id} · Code: {school.code}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={statusColor(school.status)}>{school.status}</span>
          {school.status === 'active' && (
            <button onClick={() => handleStatusChange('suspended')} className="h-7 px-3 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
              Suspend
            </button>
          )}
          {(school.status === 'suspended' || school.status === 'expired') && (
            <button onClick={() => handleStatusChange('active')} className="h-7 px-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors">
              Activate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: School Profile */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile View (Read-Only) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AppIcon name="Building2" size={18} className="text-blue-600" />
                School Profile
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <AppIcon name="Eye" size={14} />
                View only
              </span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">School Name</label>
                <div className="w-full h-8 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-medium text-slate-900 flex items-center">
                  {school.name || '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Principal Name</label>
                <div className="w-full h-8 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-medium text-slate-900 flex items-center">
                  {school.principal_name || '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
                <div className="w-full h-8 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-medium text-slate-900 flex items-center">
                  {school.email || '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                <div className="w-full h-8 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-medium text-slate-900 flex items-center">
                  {school.phone || '—'}
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Address</label>
                <div className="w-full h-8 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-medium text-slate-900 flex items-center">
                  {school.address || '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City</label>
                <div className="w-full h-8 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-medium text-slate-900 flex items-center">
                  {school.city || '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Website</label>
                <div className="w-full h-8 px-3 rounded-lg border border-slate-100 bg-slate-50 text-[12px] font-medium text-slate-900 flex items-center">
                  {school.website || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Analytics Cards */}
        <div className="space-y-4">
          {/* System Details */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AppIcon name="Info" size={18} className="text-blue-600" />
                System Details
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Registered</span>
                <span className="text-[11px] font-semibold text-slate-700">{new Date(school.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">School Code</span>
                <span className="text-[11px] font-mono font-bold text-slate-900">{school.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Plan</span>
                <span className="text-[11px] font-bold text-blue-700">{school.plan || 'Free'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue</span>
                <span className="text-[11px] font-bold text-slate-900">Rs {school.revenue?.toLocaleString() || 0}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Admin Email</span>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-700">
                  {school.owner_email || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats - White cards with blue accent */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AppIcon name="BarChart3" size={18} className="text-blue-600" />
                Quick Stats
              </h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {[
                { label: 'Students', value: school.student_count, icon: 'school', color: 'text-blue-600 bg-blue-50' },
                { label: 'Teachers', value: school.teacher_count, icon: 'badge', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Classes', value: school.class_count, icon: 'class', color: 'text-cyan-600 bg-cyan-50' },
                { label: 'Parents', value: school.parent_count || 0, icon: 'people', color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Subjects', value: school.subject_count || 0, icon: 'menu_book', color: 'text-violet-600 bg-violet-50' },
                { label: 'Revenue', value: `Rs ${(school.revenue || 0).toLocaleString()}`, icon: 'payments', color: 'text-amber-600 bg-amber-50' },
              ].map((stat) => (
                <div key={stat.label} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AppIcon name={stat.icon} size={12} className={` text-[12px] ${stat.color.split(' ')[0]} `} />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</span>
                  </div>
                  <p className="text-[14px] font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

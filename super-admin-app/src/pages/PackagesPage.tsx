import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface Package {
  _id: string
  name: string
  price: number
  billing_cycle: string
  student_limit: number
  teacher_limit: number
  parent_limit: number
  class_limit: number
  storage_limit_mb: number
  chatbot_monthly_limit: number
  ai_usage_limit: number
  question_gen_limit: number
  exam_gen_limit: number
  live_classes_limit: number
  broadcast_limit: number
  support_type: string
  custom_modules: string[]
  mod_attendance: boolean
  mod_homework: boolean
  mod_exams: boolean
  mod_question_bank: boolean
  mod_live_classes: boolean
  mod_broadcast: boolean
  mod_fees: boolean
  mod_behavior: boolean
  mod_certificates: boolean
  mod_analytics: boolean
  status: string
  created_at: string
}

const moduleToggles = [
  { key: 'mod_attendance', label: 'Attendance', icon: 'fact_check' },
  { key: 'mod_homework', label: 'Homework', icon: 'assignment' },
  { key: 'mod_exams', label: 'Exams', icon: 'quiz' },
  { key: 'mod_question_bank', label: 'Question Bank', icon: 'library_books' },
  { key: 'mod_live_classes', label: 'Live Classes', icon: 'videocam' },
  { key: 'mod_broadcast', label: 'Broadcast', icon: 'campaign' },
  { key: 'mod_fees', label: 'Fees', icon: 'payments' },
  { key: 'mod_behavior', label: 'Behavior', icon: 'psychology' },
  { key: 'mod_certificates', label: 'Certificates', icon: 'workspace_premium' },
  { key: 'mod_analytics', label: 'Analytics', icon: 'analytics' },
] as const

export function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const emptyForm = {
    name: '', price: 0, billing_cycle: 'monthly',
    student_limit: 100, teacher_limit: 20, parent_limit: 200,
    class_limit: 20, storage_limit_mb: 1024, chatbot_monthly_limit: 1000,
    ai_usage_limit: 500, question_gen_limit: 100, exam_gen_limit: 50,
    live_classes_limit: 10, broadcast_limit: 5, support_type: 'email',
    custom_modules: [] as string[],
    mod_attendance: true, mod_homework: true, mod_exams: true,
    mod_question_bank: true, mod_live_classes: true, mod_broadcast: true,
    mod_fees: true, mod_behavior: true, mod_certificates: true, mod_analytics: true,
  }

  const [form, setForm] = useState(emptyForm)

  const loadPackages = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await apiRequest(`/api/super-admin/packages?${params}`)
    if (res.ok && res.data) {
      const d = res.data as any
      setPackages(d.items || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadPackages() }, [statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `/api/super-admin/packages/${editing._id}` : '/api/super-admin/packages'
    const res = await apiRequest(url, { method, body: JSON.stringify(form) })
    if (res.ok) {
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      loadPackages()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return
    const res = await apiRequest(`/api/super-admin/packages/${id}`, { method: 'DELETE' })
    if (res.ok) loadPackages()
  }

  const handleToggle = async (pkg: Package) => {
    const newStatus = pkg.status === 'active' ? 'disabled' : 'active'
    const res = await apiRequest(`/api/super-admin/packages/${pkg._id}/toggle`, {
      method: 'POST', body: JSON.stringify({ status: newStatus })
    })
    if (res.ok) loadPackages()
  }

  const handleEdit = (pkg: Package) => {
    setEditing(pkg)
    setForm({
      name: pkg.name, price: pkg.price, billing_cycle: pkg.billing_cycle,
      student_limit: pkg.student_limit, teacher_limit: pkg.teacher_limit,
      parent_limit: pkg.parent_limit, class_limit: pkg.class_limit,
      storage_limit_mb: pkg.storage_limit_mb, chatbot_monthly_limit: pkg.chatbot_monthly_limit,
      ai_usage_limit: pkg.ai_usage_limit, question_gen_limit: pkg.question_gen_limit,
      exam_gen_limit: pkg.exam_gen_limit, live_classes_limit: pkg.live_classes_limit,
      broadcast_limit: pkg.broadcast_limit, support_type: pkg.support_type,
      custom_modules: pkg.custom_modules,
      mod_attendance: pkg.mod_attendance, mod_homework: pkg.mod_homework,
      mod_exams: pkg.mod_exams, mod_question_bank: pkg.mod_question_bank,
      mod_live_classes: pkg.mod_live_classes, mod_broadcast: pkg.mod_broadcast,
      mod_fees: pkg.mod_fees, mod_behavior: pkg.mod_behavior,
      mod_certificates: pkg.mod_certificates, mod_analytics: pkg.mod_analytics,
    })
    setShowForm(true)
  }

  const getModuleCount = (p: Package) => {
    let count = 0
    if (p.mod_attendance) count++
    if (p.mod_homework) count++
    if (p.mod_exams) count++
    if (p.mod_question_bank) count++
    if (p.mod_live_classes) count++
    if (p.mod_broadcast) count++
    if (p.mod_fees) count++
    if (p.mod_behavior) count++
    if (p.mod_certificates) count++
    if (p.mod_analytics) count++
    return count
  }

  const statusBadge = (s: string) => {
    if (s === 'active') return 'bg-blue-50 text-blue-700 border-blue-100'
    return 'bg-slate-50 text-slate-500 border-slate-100'
  }

  const totalPackages = packages.length
  const activePackages = packages.filter(p => p.status === 'active').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Packages</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage platform packages and limits</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }}
          className="h-8 px-4 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
        >
          <AppIcon name="Plus" size={14} />
          Create Package
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-xs">
          <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packages..."
            className="w-full h-8 pl-9 pr-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Packages', value: totalPackages, icon: 'inventory_2' },
          { label: 'Active', value: activePackages, icon: 'check_circle' },
          { label: 'Disabled', value: totalPackages - activePackages, icon: 'block' },
          { label: 'Avg Price', value: `Rs ${activePackages ? Math.round(packages.filter(p=>p.status==='active').reduce((a,p)=>a+p.price,0)/activePackages) : 0}`, icon: 'payments' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AppIcon name={s.icon} size={16} className="text-blue-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Package Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <AppIcon name="Inventory2" size={36} className="text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-500">No packages found</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-[11px] font-bold text-blue-600 hover:underline">Create your first package</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-200 transition-colors group">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <AppIcon name="Inventory2" size={16} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900">{pkg.name}</h3>
                    <p className="text-[10px] text-slate-400 capitalize">{pkg.billing_cycle}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(pkg.status)}`}>
                  {pkg.status}
                </span>
              </div>

              {/* Price + Limits */}
              <div className="px-5 py-3 border-b border-slate-100">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[11px] font-semibold text-slate-500">Rs</span>
                  <span className="text-2xl font-bold text-slate-900">{pkg.price.toLocaleString()}</span>
                  <span className="text-[11px] text-slate-500">/{pkg.billing_cycle}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><AppIcon name="GraduationCap" size={12} />Students</span>
                    <span className="text-[11px] font-bold text-slate-900">{pkg.student_limit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><AppIcon name="Award" size={12} />Teachers</span>
                    <span className="text-[11px] font-bold text-slate-900">{pkg.teacher_limit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><AppIcon name="Bot" size={12} />Chatbot</span>
                    <span className="text-[11px] font-bold text-slate-900">{pkg.chatbot_monthly_limit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><AppIcon name="Grid" size={12} />Modules</span>
                    <span className="text-[11px] font-bold text-slate-900">{getModuleCount(pkg)}/10</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 bg-slate-50/50 flex items-center justify-end gap-2">
                <button onClick={() => handleEdit(pkg)} className="h-6 px-2.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleToggle(pkg)} className="h-6 px-2.5 text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                  {pkg.status === 'active' ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(pkg._id)} className="h-6 px-2.5 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{editing ? 'Edit Package' : 'Create Package'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-slate-400 hover:text-slate-600">
                <AppIcon name="X" size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Package Name</label>
                  <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full h-8 px-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-blue-500" placeholder="e.g. Pro Monthly" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Price (Rs)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({...form, price: Number(e.target.value)})} className="w-full h-8 px-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Billing Cycle</label>
                  <select value={form.billing_cycle} onChange={(e) => setForm({...form, billing_cycle: e.target.value})} className="w-full h-8 px-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-blue-500">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Support Type</label>
                  <select value={form.support_type} onChange={(e) => setForm({...form, support_type: e.target.value})} className="w-full h-8 px-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-blue-500">
                    <option value="email">Email</option>
                    <option value="chat">Chat</option>
                    <option value="phone">Phone</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>

              {/* Limits */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <AppIcon name="Sliders" size={14} className="text-blue-600" />
                  Limits
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'student_limit', label: 'Students' },
                    { key: 'teacher_limit', label: 'Teachers' },
                    { key: 'parent_limit', label: 'Parents' },
                    { key: 'class_limit', label: 'Classes' },
                    { key: 'storage_limit_mb', label: 'Storage (MB)' },
                    { key: 'chatbot_monthly_limit', label: 'Chatbot/Month' },
                    { key: 'ai_usage_limit', label: 'AI Usage' },
                    { key: 'question_gen_limit', label: 'Q Gen' },
                    { key: 'exam_gen_limit', label: 'Exam Gen' },
                    { key: 'live_classes_limit', label: 'Live Classes' },
                    { key: 'broadcast_limit', label: 'Broadcast' },
                  ].map((f) => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">{f.label}</label>
                      <input type="number" value={form[f.key as keyof typeof form] as number} onChange={(e) => setForm({...form, [f.key]: Number(e.target.value)})} className="w-full h-7 px-2 rounded-lg border border-slate-200 text-[11px] outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Permissions */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <AppIcon name="Grid" size={14} className="text-blue-600" />
                  Module Permissions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {moduleToggles.map((m) => (
                    <label key={m.key} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={form[m.key] as boolean} onChange={(e) => setForm({...form, [m.key]: e.target.checked})} className="rounded border-slate-300 text-blue-600" />
                      <AppIcon name={m.icon} size={14} className="text-slate-400" />
                      <span className="text-[11px] font-medium text-slate-700">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="h-8 px-4 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="h-8 px-4 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

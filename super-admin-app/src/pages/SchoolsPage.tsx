import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '@/lib/api'

interface School {
  _id: string
  school_id: string
  name: string
  code: string
  status: string
  owner_email: string
  student_count: number
  teacher_count: number
  class_count: number
  created_at: string
}

export function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadSchools = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    const res = await apiRequest(`/api/super-admin/schools?${params}`)
    if (res.ok && res.data) {
      const d = res.data as any
      setSchools(d.items || d.data || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadSchools() }, [statusFilter])

  const handleAction = async (schoolId: string, action: 'approve' | 'suspend' | 'renew') => {
    const messages = {
      approve: 'Are you sure you want to approve and activate this school?',
      suspend: 'Are you sure you want to suspend this school? This will block their access.',
      renew: 'Are you sure you want to renew this school\'s subscription plan?'
    }
    
    // @ts-ignore
    if (!window.confirm(messages[action])) return

    const endpoint = action === 'renew' ? 'approve' : action
    const res = await apiRequest(`/api/super-admin/schools/${schoolId}/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify({ reason: action === 'suspend' ? 'Admin action' : 'Subscription renewal' }),
    })
    if (res.ok) {
      loadSchools()
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      suspended: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
      expired: 'bg-slate-100 text-slate-600',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.expired}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all registered schools on the platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSchools()}
            placeholder="Search schools..."
            className="w-full h-9 pl-10 pr-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading schools...</div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">apartment</span>
            <p className="text-sm font-medium text-slate-500">No schools found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">School</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Owner</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Students</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Teachers</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((school) => (
                <tr key={school._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/schools/${school._id}`} className="block group">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{school.name}</p>
                      <p className="text-xs text-slate-400">{school.code}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{school.owner_email}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-center">{school.student_count}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-center">{school.teacher_count}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(school.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/schools/${school._id}`}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Details
                      </Link>
                      
                      <button
                        onClick={() => handleAction(school._id, 'renew')}
                        className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Renew
                      </button>

                      {school.status === 'pending' && (
                        <button
                          onClick={() => handleAction(school._id, 'approve')}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {school.status === 'active' && (
                        <button
                          onClick={() => handleAction(school._id, 'suspend')}
                          className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Suspend
                        </button>
                      )}
                      {(school.status === 'suspended' || school.status === 'expired') && (
                        <button
                          onClick={() => handleAction(school._id, 'approve')}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
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

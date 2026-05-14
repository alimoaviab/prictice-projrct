import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'

interface User {
  _id: string
  email: string
  role: string
  school_id: string
  status: string
  name: string
  created_at: string
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter) params.set('role', roleFilter)
    if (search) params.set('search', search)
    const res = await apiRequest(`/api/super-admin/users?${params}`)
    if (res.ok && res.data) {
      const d = res.data as any
      setUsers(d.items || d.data || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [roleFilter])

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-blue-100 text-blue-700',
      teacher: 'bg-purple-100 text-purple-700',
      student: 'bg-emerald-100 text-emerald-700',
      parent: 'bg-amber-100 text-amber-700',
      super_admin: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[role] || 'bg-slate-100 text-slate-600'}`}>
        {role}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Users</h1>
        <p className="text-sm text-slate-500 mt-1">All users across all schools</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            placeholder="Search by name or email..."
            className="w-full h-9 pl-10 pr-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 outline-none"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">group</span>
            <p className="text-sm font-medium text-slate-500">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">School</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {(user.name || user.email).substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{user.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-center">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{user.school_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

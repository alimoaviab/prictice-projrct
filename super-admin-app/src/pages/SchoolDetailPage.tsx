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
  created_at: string
}

export function SchoolDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [school, setSchool] = useState<SchoolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    principal_name: '',
    website: ''
  })

  const loadDetails = async () => {
    setLoading(true)
    const res = await apiRequest(`/api/super-admin/schools`)
    if (res.ok && res.data) {
      const schools = (res.data.items || res.data.data || []) as SchoolDetail[]
      const found = schools.find(s => s._id === id || s.school_id === id)
      if (found) {
        setSchool(found)
        setFormData({
          name: found.name || '',
          email: found.email || '',
          phone: found.phone || '',
          address: found.address || '',
          city: found.city || '',
          principal_name: found.principal_name || '',
          website: found.website || ''
        })
      }
    }
    setLoading(false)
  }

  useEffect(() => { loadDetails() }, [id])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await apiRequest(`/api/super-admin/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      alert('Profile updated successfully')
      loadDetails()
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword) return
    setSaving(true)
    const res = await apiRequest(`/api/super-admin/schools/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword })
    })
    if (res.ok) {
      alert('Password updated successfully')
      setNewPassword('')
      loadDetails()
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading school details...</div>
  if (!school) return <div className="p-8 text-center text-red-500">School not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/schools')}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Platform ID: {school.school_id} • Code: {school.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section - Editable Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl">apartment</span>
                School Information
              </h3>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                <span className="material-symbols-outlined text-base">group</span>
                <span className="text-sm font-bold">{school.student_count} Students</span>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">School Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter school name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal Name</label>
                <input 
                  type="text"
                  value={formData.principal_name}
                  onChange={(e) => setFormData({...formData, principal_name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter principal name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</label>
                <input 
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter school address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">City</label>
                <input 
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Website</label>
                <input 
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter website URL"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => loadDetails()}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Password Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600 text-xl">lock</span>
                Admin Password
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleChangePassword}
                disabled={saving || !newPassword}
                className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">key</span>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600 text-xl">info</span>
                System Details
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-medium text-slate-500 uppercase">Platform Status</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  school.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {school.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-medium text-slate-500 uppercase">Registered On</span>
                <span className="text-sm font-medium text-slate-700">
                  {new Date(school.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-medium text-slate-500 uppercase">School Code</span>
                <span className="text-sm font-mono font-bold text-slate-900">{school.code}</span>
              </div>
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Admin Email</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700">
                  {school.owner_email}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">analytics</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Quick Stats</h4>
                <p className="text-[10px] text-slate-400">School Activity</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase mb-1">Teachers</p>
                <p className="text-xl font-bold">{school.teacher_count}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase mb-1">Classes</p>
                <p className="text-xl font-bold">{school.class_count}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

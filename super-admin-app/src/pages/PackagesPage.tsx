import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

interface Package {
  _id: string
  school_id: string
  package_name: string
  allowed_students: number
  current_students: number
  price: number
  duration_type: string
  start_date: string
  expiry_date: string
  payment_status: string
  is_active: boolean
  is_expired: boolean
  created_at: string
  updated_at: string
}

export function PackagesPage() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    school_id: '',
    package_name: '',
    allowed_students: '',
    price: '',
    duration_type: 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: '',
    is_active: true,
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const { apiRequest } = await import('../lib/api')
      const response = await apiRequest('/api/super-admin/packages')

      if (!response.ok) {
        throw new Error(response.message || 'Failed to fetch packages')
      }

      setPackages(response.data?.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { apiRequest } = await import('../lib/api')
      const response = await apiRequest(
        `/api/super-admin/packages?school_id=${formData.school_id}`,
        {
          method: 'POST',
          body: JSON.stringify({
            package_name: formData.package_name,
            allowed_students: parseInt(formData.allowed_students),
            price: parseFloat(formData.price),
            duration_type: formData.duration_type,
            start_date: formData.start_date,
            expiry_date: formData.expiry_date,
            notes: formData.notes,
            is_active: formData.is_active,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(response.message || 'Failed to create package')
      }

      setShowForm(false)
      setFormData({
        school_id: '',
        package_name: '',
        allowed_students: '',
        price: '',
        duration_type: 'yearly',
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        notes: '',
        is_active: true,
      })
      fetchPackages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const { apiRequest } = await import('../lib/api')
      const response = await apiRequest(`/api/super-admin/packages/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(response.message || 'Failed to delete package')
      }

      fetchPackages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="School Packages"
          description="Manage custom packages for schools"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <span className="material-symbols-outlined">add</span>
          New Package
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Package</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  School ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="school_default"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.package_name}
                  onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Premium Package"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Allowed Students
                </label>
                <input
                  type="number"
                  required
                  value={formData.allowed_students}
                  onChange={(e) => setFormData({ ...formData, allowed_students: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="99.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duration Type
                </label>
                <select
                  value={formData.duration_type}
                  onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expiry Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Package
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Packages Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  Package Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {packages.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {pkg.package_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{pkg.school_id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {pkg.current_students}/{pkg.allowed_students}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    ${pkg.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                    {pkg.duration_type}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        pkg.is_expired
                          ? 'bg-red-100 text-red-700'
                          : pkg.payment_status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {pkg.is_expired ? 'Expired' : pkg.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {packages.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No packages found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}

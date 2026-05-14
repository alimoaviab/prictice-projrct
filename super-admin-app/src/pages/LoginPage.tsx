import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('sa_token')
    if (token) navigate('/dashboard', { replace: true })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await apiRequest<{
      role: string
      token: string
      user_id: string
      email: string
      school_id: string
      active_academic_year_id?: string
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })

    setLoading(false)

    if (!res.ok || !res.data) {
      setError(res.message || 'Invalid email or password')
      return
    }

    const data = res.data

    // Verify role - only super_admin can access this panel
    if (data.role !== 'super_admin' && data.role !== 'admin') {
      setError('Access denied. This panel is only for platform administrators.')
      return
    }

    // Store credentials
    localStorage.setItem('sa_token', data.token)
    localStorage.setItem('sa_user', JSON.stringify({
      id: data.user_id,
      email: data.email,
      role: data.role,
      school_id: data.school_id,
    }))

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <span className="material-symbols-outlined text-white text-2xl">shield_lock</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Eduplexo Platform Control Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700 font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="super@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-11 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">login</span>
                Sign In
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Default: <code className="font-mono text-slate-600">super@gmail.com</code> / <code className="font-mono text-slate-600">Test@123</code>
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Eduplexo. Platform administrators only.
        </p>
      </div>
    </div>
  )
}

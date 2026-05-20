import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Schools', href: '/schools', icon: 'apartment' },
  { label: 'Plans', href: '/plans', icon: 'credit_card' },
  { label: 'Payments', href: '/payments', icon: 'payments' },
  { label: 'Finance', href: '/finance', icon: 'trending_up' },
  { label: 'Packages', href: '/packages', icon: 'inventory_2' },
  { label: 'Expenses', href: '/expenses', icon: 'receipt_long' },
  { label: 'Moderation', href: '/moderation', icon: 'shield' },
  { label: 'Users', href: '/users', icon: 'group' },
]

interface SAUser {
  id: string
  email: string
  role: string
  school_id: string
}

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<SAUser | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('sa_token')
    const userJson = localStorage.getItem('sa_user')

    if (!token || !userJson) {
      navigate('/login', { replace: true })
      return
    }

    try {
      const parsed = JSON.parse(userJson) as SAUser
      // Only allow super_admin or admin role
      if (parsed.role !== 'super_admin' && parsed.role !== 'admin') {
        localStorage.removeItem('sa_token')
        localStorage.removeItem('sa_user')
        navigate('/login', { replace: true })
        return
      }
      setUser(parsed)
    } catch {
      localStorage.removeItem('sa_token')
      localStorage.removeItem('sa_user')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_user')
    navigate('/login', { replace: true })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-600/20">
            <span className="material-symbols-outlined text-white text-sm">shield_lock</span>
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-none">Eduplexo</span>
            <span className="text-[10px] text-slate-400 font-medium">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50/60">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
              {(user.email || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

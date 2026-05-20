import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Schools', href: '/schools', icon: 'apartment' },
  { label: 'Packages', href: '/packages', icon: 'inventory_2' },
  { label: 'Subscriptions', href: '/subscriptions', icon: 'card_membership' },
  { label: 'Payments', href: '/payments', icon: 'payments' },
  { label: 'AI Usage', href: '/ai-usage', icon: 'smart_toy' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0">
        <div className="h-12 flex items-center gap-2.5 px-4 border-b border-slate-100">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm">shield_lock</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-900 leading-none tracking-tight">Eduplexo</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Platform</span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50/80">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {(user.email || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-900 truncate">{user.email}</p>
              <p className="text-[9px] text-slate-400 font-semibold capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-5 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

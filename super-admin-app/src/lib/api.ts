// Super Admin API client

// Base URL for the backend API. Set VITE_API_URL in production (Vercel) to
// point at the deployed Go backend. Leave empty in dev to use Vite proxy.
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function resolveUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url
  if (!API_BASE_URL) return url
  if (url.startsWith('/')) return API_BASE_URL + url
  return `${API_BASE_URL}/${url}`
}

function getToken(): string | null {
  return localStorage.getItem('sa_token')
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; message?: string; error?: any }> {
  try {
    const token = getToken()
    const res = await fetch(resolveUrl(url), {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

    const text = await res.text()
    let payload: any = null
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = null
      }
    }

    if (res.status === 401) {
      const onLogin = window.location.pathname === '/login'
      if (!onLogin) {
        localStorage.removeItem('sa_token')
        localStorage.removeItem('sa_user')
        window.location.replace('/login')
      }
      return {
        ok: false,
        message: payload?.message || 'Invalid credentials',
        error: payload?.error,
      }
    }

    if (res.ok) {
      if (payload?.ok !== undefined) return payload
      return { ok: true, data: payload }
    }

    return {
      ok: false,
      message: payload?.message || payload?.error?.message || 'Request failed',
      error: payload?.error,
    }
  } catch {
    return { ok: false, message: 'Network error' }
  }
}

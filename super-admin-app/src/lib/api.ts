// Super Admin API client

function getToken(): string | null {
  return localStorage.getItem('sa_token')
}

export async function apiRequest<T = any>(url: string, options: RequestInit = {}): Promise<{ ok: boolean; data?: T; message?: string; error?: any }> {
  try {
    const token = getToken()
    const res = await fetch(url, {
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
      try { payload = JSON.parse(text) } catch { payload = null }
    }

    if (res.status === 401) {
      localStorage.removeItem('sa_token')
      localStorage.removeItem('sa_user')
      window.location.replace('/login')
      return { ok: false, message: 'Session expired' }
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

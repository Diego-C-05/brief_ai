const BASE = import.meta.env.VITE_API_URL as string
import { getAuthHeader, decodeToken } from './authService'

export type ProfileResponse = {
  success?: boolean
  profile?: {
    userId?: string
    username?: string
    email?: string
    macroTopics?: string[]
    keywords?: string[]
    subscriptionPlan?: 'free' | 'pro'
    subscriptionExpiresAt?: string | null
  }
}

const authFetch = (path: string, options: RequestInit = {}) =>
  fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeader(), ...options.headers },
  })

// GET /api/profile
export const fetchProfile = () =>
  authFetch('/api/profile').then((r) => r.json() as Promise<ProfileResponse>)

// PUT /api/profile
export const updateProfile = async (data: {
  macroTopics?: string[]
  keywords?: string[]
  subscriptionState?: 'free' | 'pro'
}) => {
  const backendRes = await authFetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => r.json())

  const n8nUrl = import.meta.env.VITE_N8N_URL
  const token = localStorage.getItem('briefai_token')
  const userId = token ? (decodeToken(token) as { userId?: string } | null)?.userId : null

  if (n8nUrl && userId) {
    try {
      await fetch(`${n8nUrl}/briefai/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      })
    } catch (e) {
      console.warn('Failed to sync profile to n8n webhook', e)
    }
  }

  return backendRes
}

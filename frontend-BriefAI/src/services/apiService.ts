const BASE = import.meta.env.VITE_API_URL as string
import { getAuthHeader } from './authService'

const authFetch = (path: string, options: RequestInit = {}) =>
  fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeader(), ...options.headers },
  })

// GET /api/stats/sentiment
export const fetchSentimentStats = () =>
  authFetch('/api/stats/sentiment').then((r) => r.json())

// GET /api/stats/trending
export const fetchTrendingTopics = () =>
  authFetch('/api/stats/trending').then((r) => r.json())

// GET /api/stats/categories
export const fetchCategoryStats = () =>
  authFetch('/api/stats/categories').then((r) => r.json())

// GET /api/stats/sources
export const fetchSourceStats = () =>
  authFetch('/api/stats/sources').then((r) => r.json())

// GET /api/stats/overview
export const fetchOverview = () =>
  authFetch('/api/stats/overview').then((r) => r.json())

// GET /api/profile
export const fetchProfile = () =>
  authFetch('/api/profile').then((r) => r.json())

// PUT /api/profile
export const updateProfile = async (data: {
  userId?: string
  macroTopics?: string[]
  keywords?: string[]
}) => {
  // Sync to backend
  const backendRes = await authFetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => r.json());

  // Opt-in sync to n8n if url is present and userId is known
  const n8nUrl = import.meta.env.VITE_N8N_URL;
  if (n8nUrl && data.userId && data.macroTopics) {
    try {
      await fetch(`${n8nUrl}/briefai/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          macroTopics: data.macroTopics,
          keywords: data.keywords,
        })
      });
    } catch (e) {
      console.warn("Failed to sync profile to n8n webhook", e);
    }
  }

  return backendRes;
}

import type { Article } from '../types/article'
import { getAuthHeader, decodeToken } from './authService'

const N8N = import.meta.env.VITE_N8N_URL

export const fetchPersonalizedFeed = async (): Promise<Article[]> => {
  console.log("🚀 N8N URL:", N8N);
  const token = localStorage.getItem('briefai_token')
  if (!token) throw new Error('Non autenticato')

  const payload = decodeToken(token)
  const userId: string = payload?.userId
  if (!userId) throw new Error('Token non valido')

  const res = await fetch(`${N8N}/briefai/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ userId, limit: 20 }),
  })
  if (!res.ok) {
    const status = res.status
    const statusText = res.statusText
    const errorText = await res.text().catch(() => 'non leggibile')
    console.error('[FeedService] HTTP Error:', { status, statusText, errorText })
    throw new Error(`Errore nel recupero del feed: ${status} ${statusText}`)
  }
  const data = await res.json()
  console.log('[FeedService] Response:', data)
  const articles = (data.articles ?? []).map((a: any) => {
    const idVal = a.uniqueKey ?? a.id ?? a._id ?? ''
    const uniqueKey = typeof idVal === 'object' ? String(idVal) : idVal
    return { ...a, uniqueKey }
  })
  return articles
}

import type { Article } from '../types/article'
import { getAuthHeader, decodeToken, getMe } from './authService'

const N8N = import.meta.env.VITE_N8N_URL

export const fetchPersonalizedFeed = async (): Promise<Article[]> => {
  console.log("🚀 N8N URL:", N8N);
  const token = localStorage.getItem('briefai_token')
  if (!token) throw new Error('Non autenticato')

  const payload = decodeToken(token)
  let userId: string = payload?.userId

  // Fallback: if token decoding failed, ask backend who we are
  if (!userId) {
    try {
      const me = await getMe()
      userId = me?.user?.userId
    } catch {
      // ignore and let later check throw
    }
  }

  if (!userId) throw new Error('Token non valido o utente non riconosciuto')

  const res = await fetch(`${N8N}/briefai/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ userId, limit: 50 }),
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
  const articles = (data.articles ?? []).map((a: unknown) => {
    const item = a as Record<string, unknown>
    const idVal = item.uniqueKey ?? item.id ?? item._id ?? ''
    const uniqueKey = typeof idVal === 'object' ? String(idVal) : String(idVal ?? '')

    const title = String(item.title ?? '')
    const url = String(item.url ?? '')
    const pubDate = String(item.pubDate ?? '')
    const source = String(item.source ?? '')
    const category = String(item.category ?? '')
    const summary = String(item.summary ?? '')
    const sentimentRaw = item.sentiment as unknown
    const sentiment =
      sentimentRaw === 'Positive' || sentimentRaw === 'Negative' || sentimentRaw === 'Neutral'
        ? (sentimentRaw as 'Positive' | 'Negative' | 'Neutral')
        : 'Neutral'
    const entities = Array.isArray(item.entities) ? (item.entities as unknown[]).map(String) : []
    const trendingTopics = Array.isArray(item.trendingTopics)
      ? (item.trendingTopics as unknown[]).map(String)
      : []
    const macroTopics = Array.isArray(item.macroTopics) ? (item.macroTopics as unknown[]).map(String) : undefined
    const score = typeof item.score === 'number' ? item.score : undefined

    return { uniqueKey, title, url, pubDate, source, category, summary, sentiment, entities, trendingTopics, macroTopics, score }
  })
  return articles
}

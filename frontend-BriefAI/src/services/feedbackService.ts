import { decodeToken } from './authService'

const N8N = import.meta.env.VITE_N8N_URL
const FEEDBACK_TIMEOUT_MS = 5000

export const sendFeedback = async (
  articleId: string,
  vote: 1 | -1
): Promise<void> => {
  const token = localStorage.getItem('briefai_token')
  if (!token) throw new Error('Token mancante')

  if (!N8N) throw new Error('VITE_N8N_URL non configurata')

  const payload = decodeToken(token) as { userId?: string } | null
  if (!payload) throw new Error('Token non valido')
  if (!payload.userId) throw new Error('userId non presente nel token')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS)

  try {
    const response = await fetch(`${N8N}/briefai/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payload.userId,
        articleId,
        vote,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Feedback HTTP ${response.status}`)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout feedback')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const saveArticle = async (articleId: string): Promise<void> => {
  const token = localStorage.getItem('briefai_token')
  if (!token) throw new Error('Token mancante')

  if (!N8N) {
    // Fallback: salva solo localmente se n8n non è configurato
    console.warn('N8N_URL non configurato, salvataggio locale')
    const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    saved[articleId] = true
    localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
    return
  }

  const payload = decodeToken(token) as { userId?: string } | null
  if (!payload) throw new Error('Token non valido')
  if (!payload.userId) throw new Error('userId non presente nel token')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS)

  try {
    const response = await fetch(`${N8N}/briefai/save-article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payload.userId,
        articleId,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(`Save article HTTP ${response.status}`, response)
      // Fallback locale se n8n fallisce
      const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
      saved[articleId] = true
      localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
      return
    }
  } catch (error) {
    console.error('Save article error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout save article')
    }
    // Fallback locale se errore di rete
    const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    saved[articleId] = true
    localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
  } finally {
    clearTimeout(timeoutId)
  }
}

export const unsaveArticle = async (articleId: string): Promise<void> => {
  const token = localStorage.getItem('briefai_token')
  if (!token) {
    // Fallback local removal
    const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    delete saved[articleId]
    localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
    return
  }

  if (!N8N) {
    // Fallback: remove only localmente se n8n non è configurato
    const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    delete saved[articleId]
    localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
    return
  }

  const payload = decodeToken(token) as { userId?: string } | null
  if (!payload) {
    const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    delete saved[articleId]
    localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
    return
  }

  if (!payload.userId) {
    const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    delete saved[articleId]
    localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
    return
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS)

  try {
    const response = await fetch(`${N8N}/briefai/unsave-article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: payload.userId, articleId }),
      signal: controller.signal,
    })

    if (!response.ok) {
      // Fallback locale se n8n fallisce
      const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
      delete saved[articleId]
      localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
      return
    }
  } catch (error) {
    console.error('Unsave article error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout unsave article')
    }
    const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    delete saved[articleId]
    localStorage.setItem('briefai_saved_articles', JSON.stringify(saved))
  } finally {
    clearTimeout(timeoutId)
  }
}

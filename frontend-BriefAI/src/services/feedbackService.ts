const N8N = import.meta.env.VITE_N8N_URL
const FEEDBACK_TIMEOUT_MS = 5000

export const sendFeedback = async (
  articleId: string,
  vote: 1 | -1
): Promise<void> => {
  const token = localStorage.getItem('briefai_token')
  if (!token) throw new Error('Token mancante')

  if (!N8N) throw new Error('VITE_N8N_URL non configurata')

  let payload: { userId?: string } | null = null
  try {
    payload = JSON.parse(atob(token.split('.')[1]))
  } catch {
    throw new Error('Token non valido')
  }

  if (!payload?.userId) throw new Error('userId non presente nel token')

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

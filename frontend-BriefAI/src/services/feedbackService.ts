const N8N = import.meta.env.VITE_N8N_URL

export const sendFeedback = async (
  articleId: string,
  vote: 1 | -1
): Promise<void> => {
  const token = localStorage.getItem('briefai_token')
  if (!token) return

  const payload = JSON.parse(atob(token.split('.')[1]))

  await fetch(`${N8N}/briefai/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: payload.userId,
      articleId,
      vote,
    }),
  })
}

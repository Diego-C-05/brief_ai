import { useEffect, useState } from 'react'
import MagicCard from './MagicCard'
import { fetchPersonalizedFeed } from '../services/feedService'
import { sendFeedback, saveArticle, unsaveArticle } from '../services/feedbackService'
import type { Article } from '../types/article'

type FeedContentProps = {
  sentimentFilter?: string | null
  topicsFilter?: string | null
  preferenceFilter?: string | null
}

function FeedContent({ sentimentFilter = null, topicsFilter = null, preferenceFilter = null }: FeedContentProps) {
  // Inizializza lo state direttamente dal localStorage per evitare render vuoto
  const [articles, setArticles] = useState<Article[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [voteByArticle, setVoteByArticle] = useState<Record<string, 1 | -1 | null>>(() => {
    try {
      return JSON.parse(localStorage.getItem('briefai_voted_articles') || '{}')
    } catch {
      return {}
    }
  })
  const [pendingByArticle, setPendingByArticle] = useState<Record<string, boolean>>({})
  const [savedByArticle, setSavedByArticle] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
    } catch {
      return {}
    }
  })
  const [savePendingByArticle, setSavePendingByArticle] = useState<Record<string, boolean>>({})
  const [voteError, setVoteError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Lettura pura delle preferenze dal localStorage (non fa setState)
  const readPreferencesFromLocalStorage = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('briefai_saved_articles') || '{}')
      const votes = JSON.parse(localStorage.getItem('briefai_voted_articles') || '{}')
      return { saved, votes }
    } catch (e) {
      console.warn('Errore lettura preferenze da localStorage:', e)
      return { saved: {}, votes: {} }
    }
  }

  useEffect(() => {
    // Nota: non eseguiamo setState sincroni al mount (evitiamo cascading renders).
    // Manteniamo invece i listener che risincronizzano le preferenze solo se cambiano.

    const resyncPreferencesIfChanged = () => {
      try {
        const { saved, votes } = readPreferencesFromLocalStorage()

        setSavedByArticle((prev) => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(saved)) return prev
          } catch {
            // fallback: continue and replace
          }
          console.log('[FeedContent] Aggiornando savedByArticle da storage')
          return saved
        })

        setVoteByArticle((prev) => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(votes)) return prev
          } catch {
            // fallback: continue and replace
          }
          console.log('[FeedContent] Aggiornando voteByArticle da storage')
          return votes
        })
      } catch (e) {
        console.warn('[FeedContent] Errore durante resyncPreferencesIfChanged:', e)
      }
    }

    // Sincronizza quando il localStorage cambia (es. da altre tab o quando torni al feed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'briefai_saved_articles' || e.key === 'briefai_voted_articles' || e.key === null) {
        console.log('[FeedContent] Storage event rilevato:', e.key)
        resyncPreferencesIfChanged()
      }
    }

    // Sincronizza quando la pagina diventa visibile (es. dopo aver navigato)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[FeedContent] Pagina diventa visibile, ricaricando preferenze')
        resyncPreferencesIfChanged()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Persisti voti in localStorage quando cambiano
  useEffect(() => {
    try {
      localStorage.setItem('briefai_voted_articles', JSON.stringify(voteByArticle))
    } catch (e) {
      console.warn('Errore salvataggio voti:', e)
    }
  }, [voteByArticle])

  // Persisti articoli salvati in localStorage quando cambiano
  useEffect(() => {
    try {
      localStorage.setItem('briefai_saved_articles', JSON.stringify(savedByArticle))
    } catch (e) {
      console.warn('Errore salvataggio articoli salvati:', e)
    }
  }, [savedByArticle])

  const sendVoteDelta = async (articleId: string, previousVote: 1 | -1 | null, nextVote: 1 | -1 | null) => {
    // Without server idempotency, simulate undo by applying compensating vote.
    if (previousVote === nextVote) return

    if (previousVote === null && nextVote !== null) {
      await sendFeedback(articleId, nextVote)
      return
    }

    if (previousVote !== null && nextVote === null) {
      await sendFeedback(articleId, previousVote === 1 ? -1 : 1)
      return
    }

    if (previousVote !== null && nextVote !== null) {
      await sendFeedback(articleId, nextVote)
    }
  }

  const handleVoteChange = async (articleId: string, nextVote: 1 | -1 | null) => {
    const previousVote = voteByArticle[articleId] ?? null
    if (previousVote === nextVote || pendingByArticle[articleId]) return

    setVoteError(null)
    setVoteByArticle((prev) => ({ ...prev, [articleId]: nextVote }))
    setPendingByArticle((prev) => ({ ...prev, [articleId]: true }))

    try {
      await sendVoteDelta(articleId, previousVote, nextVote)
    } catch {
      setVoteByArticle((prev) => ({ ...prev, [articleId]: previousVote }))
      setVoteError('Impossibile aggiornare il voto. Riprova.')
    } finally {
      setPendingByArticle((prev) => ({ ...prev, [articleId]: false }))
    }
  }

  const handleSaveArticle = async (articleId: string) => {
    if (savePendingByArticle[articleId]) return

    setSaveError(null)
    // Toggle locally first and persist immediately to localStorage to avoid losing state on quick navigation
    const nextSaved = !(savedByArticle[articleId] ?? false)
    const nextSavedMap = { ...savedByArticle, [articleId]: nextSaved }
    if (!nextSaved) {
      // remove key when toggling off
      delete nextSavedMap[articleId]
    }
    setSavedByArticle(nextSavedMap)
    try {
      localStorage.setItem('briefai_saved_articles', JSON.stringify(nextSavedMap))
    } catch (e) {
      console.warn('Errore persistenza locale immediata:', e)
    }
    setSavePendingByArticle((prev) => ({ ...prev, [articleId]: true }))

    try {
      if (nextSaved) {
        await saveArticle(articleId)
      } else {
        await unsaveArticle(articleId)
      }
    } catch {
      // Revert optimistic update on error
      setSavedByArticle((prev) => ({ ...prev, [articleId]: !nextSaved }))
      setSaveError('Impossibile salvare l\'articolo. Riprova.')
    } finally {
      setSavePendingByArticle((prev) => ({ ...prev, [articleId]: false }))
    }
  }

// Prende il fetch del feed personalizzato e popola la variabile di stato con i dati
  useEffect(() => {fetchPersonalizedFeed().then((data) => {
        setArticles(data)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <section className="feed-content" aria-label="Contenuto feed">
      <header className="feed-header">
        <p className="feed-kicker">BriefAI Notizie</p>
        <h1>Il tuo flusso di intelligenza</h1>
        <p>Notizie personalizzate con approfondimenti AI</p>
      </header>
{/* Gestione degli stati*/}
      {status === 'loading' && <p>Caricamento feed...</p>}
      {status === 'error' && <p>Errore nel caricamento del feed.</p>}
      {voteError && <p className="feed-no-results">{voteError}</p>}
      {saveError && <p className="feed-no-results">{saveError}</p>}
{/*Render della lista di articoli se il caricamento è andato a buon fine*/}
      {status === 'ok' && (
        <>
          {/* Client-side filtering */}
          {(() => {
            const matchesTopic = (a: Article) => {
              if (!topicsFilter || topicsFilter === 'All Topics') return true
              const topic = topicsFilter.toLowerCase().trim()
              const catMatch = (a.category || '').toLowerCase().trim() === topic
              const trending = (a.trendingTopics || []).some((t) =>
                String(t || '').toLowerCase().trim() === topic
              )
              const macroTopicMatch = (a.macroTopics || []).some((t) =>
                String(t || '').toLowerCase().trim() === topic
              )
              return catMatch || trending || macroTopicMatch
            }

            const matchesSentiment = (a: Article) => {
              if (!sentimentFilter || sentimentFilter === 'All Sentiment') return true
              return a.sentiment === sentimentFilter
            }

            const matchesPreference = (a: Article) => {
              if (!preferenceFilter || preferenceFilter === 'Tutti') return true
              if (preferenceFilter === 'Salvati') {
                return savedByArticle[a.uniqueKey] === true
              }
              return true
            }

            const filtered = articles.filter((a) => matchesSentiment(a) && matchesTopic(a) && matchesPreference(a))

            return (
              <div>
                {filtered.length > 0 ? (
                  <>
                    <div className="feed-list">
                      {filtered.map((a) => (
                        <MagicCard
                          key={a.uniqueKey}
                          articleId={a.uniqueKey}
                          articleUrl={a.url}
                          source={a.source}
                          timeAgo={new Date(a.pubDate).toLocaleString()}
                          sentiment={
                            a.sentiment === 'Positive'
                              ? 'Positivo'
                              : a.sentiment === 'Negative'
                              ? 'Negativo'
                              : 'Neutrale'
                          }
                          title={a.title}
                          summary={a.summary}
                          tags={a.macroTopics?.length ? a.macroTopics : (a.trendingTopics || [a.category])}
                          entities={a.entities || []}
                          voteState={voteByArticle[a.uniqueKey] ?? null}
                          votePending={pendingByArticle[a.uniqueKey] ?? false}
                          isSaved={savedByArticle[a.uniqueKey] ?? false}
                          savePending={savePendingByArticle[a.uniqueKey] ?? false}
                          onVoteChange={handleVoteChange}
                          onSave={handleSaveArticle}
                        />
                      ))}
                    </div>
                    <p className="feed-filter-info">
                      Mostrando {filtered.length} di {articles.length} articoli
                      {(sentimentFilter && sentimentFilter !== 'All Sentiment') ||
                      (topicsFilter && topicsFilter !== 'All Topics')
                        ? ` con${sentimentFilter && sentimentFilter !== 'All Sentiment' ? ` sentiment ${sentimentFilter}` : ''}${
                            sentimentFilter && topicsFilter ? ' e' : ''
                          }${topicsFilter && topicsFilter !== 'All Topics' ? ` topic ${topicsFilter}` : ''}`
                        : ''}
                    </p>
                  </>
                ) : (
                  <p className="feed-no-results">
                    Nessun articolo trovato con i filtri selezionati
                  </p>
                )}
              </div>
            )
          })()}
        </>
      )}

    </section>
  )
}

export default FeedContent

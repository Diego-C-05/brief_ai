import { useEffect, useState } from 'react'
import MagicCard from './MagicCard'
import { fetchPersonalizedFeed } from '../services/feedService'
import type { Article } from '../types/article'

type FeedContentProps = {
  sentimentFilter?: string | null
  topicsFilter?: string | null
}

function FeedContent({ sentimentFilter = null, topicsFilter = null }: FeedContentProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

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
{/*Render della lista di articoli se il caricamento è andato a buon fine*/}
      {status === 'ok' && (
        <>
          {/* Client-side filtering */}
          {(() => {
            const matchesTopic = (a: Article) => {
              if (!topicsFilter || topicsFilter === 'All Topics') return true
              const topic = topicsFilter.toLowerCase()
              const catMatch = (a.category || '').toLowerCase() === topic
              const trending = (a.trendingTopics || []).some((t) =>
                String(t || '').toLowerCase() === topic
              )
              const macroTopicMatch = (a.macroTopics || []).some((t) =>
                String(t || '').toLowerCase() === topic
              )
              return catMatch || trending || macroTopicMatch
            }

            const matchesSentiment = (a: Article) => {
              if (!sentimentFilter || sentimentFilter === 'All Sentiment') return true
              return a.sentiment === sentimentFilter
            }

            const filtered = articles.filter((a) => matchesSentiment(a) && matchesTopic(a))

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

      <div className="feed-footer">
        <button type="button" className="load-more-button">
          Carica altre notizie
        </button>
      </div>
    </section>
  )
}

export default FeedContent

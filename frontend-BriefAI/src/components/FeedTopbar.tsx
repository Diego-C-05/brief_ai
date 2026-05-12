type FeedTopbarProps = {
  showFeedFilters?: boolean
  sentimentFilter?: string | null
  onSentimentChange?: (sentiment: string) => void
  topicsFilter?: string | null
  onTopicChange?: (topic: string) => void
  preferenceFilter?: string | null
  onPreferenceChange?: (preference: string) => void
}

function FeedTopbar({
  showFeedFilters = false,
  sentimentFilter = null,
  onSentimentChange,
  topicsFilter = null,
  onTopicChange,
  preferenceFilter = null,
  onPreferenceChange,
}: FeedTopbarProps) {
  return (
    <header
      className={`feed-topbar ${showFeedFilters ? 'with-filters' : ''}`}
      aria-label="Intestazione feed"
    >
      {showFeedFilters ? (
        <nav className="feed-filter-nav" aria-label="Filtri feed">
          <label className="feed-filter-control" htmlFor="sentiment-filter">
            <span className="feed-filter-label">Sentiment</span>
            <select
              id="sentiment-filter"
              value={sentimentFilter || 'All Sentiment'}
              onChange={(e) => onSentimentChange?.(e.target.value)}
            >
              <option>All Sentiment</option>
              <option>Positive</option>
              <option>Negative</option>
              <option>Neutral</option>
            </select>
          </label>

          <label className="feed-filter-control" htmlFor="topic-filter">
            <span className="feed-filter-label">Topics</span>
            <select
              id="topic-filter"
              value={topicsFilter || 'All Topics'}
              onChange={(e) => onTopicChange?.(e.target.value)}
            >
              <option>All Topics</option>
              <option>Intelligenza Artificiale</option>
              <option>Cybersecurity</option>
              <option>Business & Finanza</option>
              <option>Politica & Geopolitica</option>
              <option>Startup & Innovazione</option>
              <option>Software & Sviluppo</option>
              <option>Scienza & Ricerca</option>
              <option>Energia & Ambiente</option>
              <option>Economia & Mercati</option>
              <option>Social Media & Cultura</option>
              <option>Salute & Medicina</option>
              <option>Trasporti & Mobilità</option>
            </select>
          </label>

          <label className="feed-filter-control" htmlFor="preference-filter">
            <span className="feed-filter-label">Preferenza</span>
            <select
              id="preference-filter"
              value={preferenceFilter || 'Tutti'}
              onChange={(e) => onPreferenceChange?.(e.target.value)}
            >
              <option>Tutti</option>
              <option>Salvati</option>
            </select>
          </label>
        </nav>
      ) : null}
    </header>
  )
}

export default FeedTopbar

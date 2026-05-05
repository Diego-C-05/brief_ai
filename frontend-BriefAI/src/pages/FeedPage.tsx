import { useState } from 'react'
import FeedContent from '../components/FeedContent'
import FeedSidebar from '../components/FeedSidebar'
import FeedTopbar from '../components/FeedTopbar'
import './FeedPage.css'

function FeedPage() {
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null)
  const [topicsFilter, setTopicsFilter] = useState<string | null>(null)

  const handleSentimentChange = (sentiment: string) => {
    setSentimentFilter(sentiment === 'All Sentiment' ? null : sentiment)
  }

  const handleTopicChange = (topic: string) => {
    setTopicsFilter(topic === 'All Topics' ? null : topic)
  }

  return (
    <div className="feed-layout" aria-label="Feed BriefAI">
      <FeedSidebar activeItem="feed" />

      <section className="feed-main">
        <FeedTopbar
          showFeedFilters
          sentimentFilter={sentimentFilter}
          onSentimentChange={handleSentimentChange}
          topicsFilter={topicsFilter}
          onTopicChange={handleTopicChange}
        />
        <FeedContent sentimentFilter={sentimentFilter} topicsFilter={topicsFilter} />
      </section>
    </div>
  )
}

export default FeedPage

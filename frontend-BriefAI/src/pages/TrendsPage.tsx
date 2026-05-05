import FeedSidebar from '../components/FeedSidebar'
import FeedTopbar from '../components/FeedTopbar'
import './FeedPage.css'
import './TrendsPage.css'
import { useEffect, useState } from 'react'
import { fetchTrendingTopics, fetchSentimentStats } from '../services/apiService'

type Sentiment = 'Positive' | 'Negative' | 'Neutral'

type TrendingTopic = {
  rank: number
  name: string
  description: string
  volume: number
  growth: number
  articles: number
  sentiment: Sentiment
}

const defaultTrendingTopics: TrendingTopic[] = [
  {
    rank: 1,
    name: 'AI Safety',
    description: 'Major breakthroughs in AI safety frameworks and alignment research',
    volume: 1420,
    growth: 45,
    articles: 87,
    sentiment: 'Positive',
  },
  {
    rank: 2,
    name: 'Quantum Computing',
    description: 'New quantum processors and cryptography implications',
    volume: 980,
    growth: 32,
    articles: 54,
    sentiment: 'Neutral',
  },
  {
    rank: 3,
    name: 'Fintech Investment',
    description: 'Record funding rounds in AI-powered financial solutions',
    volume: 870,
    growth: 28,
    articles: 62,
    sentiment: 'Positive',
  },
  {
    rank: 4,
    name: 'Crypto Regulation',
    description: 'Increased regulatory scrutiny and compliance requirements',
    volume: 760,
    growth: 18,
    articles: 48,
    sentiment: 'Negative',
  },
  {
    rank: 5,
    name: 'Clean Energy',
    description: 'Battery technology breakthroughs and renewable energy adoption',
    volume: 640,
    growth: 15,
    articles: 41,
    sentiment: 'Positive',
  },
  {
    rank: 6,
    name: 'Remote Work Tech',
    description: 'New collaboration tools and hybrid workplace solutions',
    volume: 520,
    growth: 12,
    articles: 35,
    sentiment: 'Neutral',
  },
  {
    rank: 7,
    name: 'Cybersecurity',
    description: 'Rising threats and zero-trust architecture adoption',
    volume: 480,
    growth: 10,
    articles: 32,
    sentiment: 'Negative',
  },
  {
    rank: 8,
    name: 'Space Tech',
    description: 'Commercial space launches and satellite communications',
    volume: 420,
    growth: 8,
    articles: 28,
    sentiment: 'Positive',
  },
]

function formatMentions(value: number) {
  return value.toLocaleString('en-US')
}

function getSentimentClass(sentiment: Sentiment) {
  if (sentiment === 'Positive') {
    return 'topic-sentiment positive'
  }

  if (sentiment === 'Negative') {
    return 'topic-sentiment negative'
  }

  return 'topic-sentiment neutral'
}

function getRankClass(rank: number) {
  if (rank === 1) return 'topic-rank rank-1'
  if (rank === 2) return 'topic-rank rank-2'
  if (rank === 3) return 'topic-rank rank-3'
  return 'topic-rank rank-default'
}

function getProgressClass(rank: number) {
  return rank === 1 ? 'topic-progress-fill top' : 'topic-progress-fill standard'
}

function TrendsPage() {
  const [topics, setTopics] = useState<TrendingTopic[]>(defaultTrendingTopics)
  const [sentimentOverview, setSentimentOverview] = useState<any>(null)

  useEffect(() => {
    fetchTrendingTopics()
      .then((data) => {
        if (Array.isArray(data) && data.length) setTopics(data)
      })
      .catch(() => {})

    fetchSentimentStats()
      .then((data) => setSentimentOverview(data))
      .catch(() => {})
  }, [])

  return (
    <div className="feed-layout" aria-label="Trending Topics BriefAI">
      <FeedSidebar activeItem="tendenze" />

      <section className="feed-main">
        <FeedTopbar />

        <section className="feed-content trends-content" aria-label="Contenuto trending topics">
          <header className="trends-header">
            <div className="trends-title-row">
              <span className="trends-flame" aria-hidden="true">
                🔥
              </span>
              <h1>Trending Topics</h1>
            </div>
            <p>Hot topics ranked by growth and volume</p>
          </header>

          <section className="trends-stats-grid" aria-label="Statistiche trend principali">
            <article className="trend-stat-card hottest">
              <span className="trend-stat-icon" aria-hidden="true">
                🔥
              </span>
              <p className="trend-stat-label">Hottest Topic</p>
              <p className="trend-stat-value">AI Safety</p>
              <p className="trend-stat-meta">+45% growth this week</p>
            </article>

            <article className="trend-stat-card emerging">
              <span className="trend-stat-icon" aria-hidden="true">
                <TrendingUpMiniIcon />
              </span>
              <p className="trend-stat-label">Emerging Topics</p>
              <p className="trend-stat-value">12</p>
              <p className="trend-stat-meta">New this week</p>
            </article>

            <article className="trend-stat-card growth">
              <span className="trend-stat-icon" aria-hidden="true">
                <ArrowUpMiniIcon />
              </span>
              <p className="trend-stat-label">Avg. Growth</p>
              <p className="trend-stat-value">+21%</p>
              <p className="trend-stat-meta">Across all topics</p>
            </article>
          </section>

          <section className="trends-list" aria-label="Lista trending topics">
            {topics.map((topic) => (
              <article key={topic.rank} className="topic-card-row">
                <div className={getRankClass(topic.rank)} aria-label={`Rank ${topic.rank}`}>
                  #{topic.rank}
                </div>

                <div className="topic-main">
                  <div className="topic-top-row">
                    <h2>{topic.name}</h2>
                    <span className={getSentimentClass(topic.sentiment)}>{topic.sentiment}</span>
                  </div>

                  <p className="topic-description">{topic.description}</p>

                  <div className="topic-metrics-row" aria-label={`Metriche ${topic.name}`}>
                    <p className="topic-growth">
                      <TrendingUpMiniIcon />
                      <span>{`+${topic.growth}%`}</span>
                    </p>
                    <p className="topic-volume">
                      <strong>{formatMentions(topic.volume)}</strong> mentions
                    </p>
                    <p className="topic-articles">
                      <strong>{topic.articles}</strong> articles
                    </p>
                  </div>

                  <div className="topic-progress-track" aria-hidden="true">
                    <div
                      className={getProgressClass(topic.rank)}
                      style={{ width: `${Math.min((topic.growth / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </section>
      </section>
    </div>
  )
}

function TrendingUpMiniIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 16l6-6 4 4 8-8" />
      <path d="M14 6h7v7" />
    </svg>
  )
}

function ArrowUpMiniIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  )
}

export default TrendsPage

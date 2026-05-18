import type { ReactNode } from 'react'

import { useEffect, useState } from 'react'

type MagicCardProps = {
  articleId?: string
  articleUrl?: string
  source: string
  timeAgo: string
  sentiment: 'Positivo' | 'Negativo' | 'Neutrale'
  title: string
  summary: string
  tags: string[]
  entities: string[]
  voteState: 1 | -1 | null
  votePending?: boolean
  isSaved?: boolean
  savePending?: boolean
  onVoteChange: (articleId: string, nextVote: 1 | -1 | null) => void
  onSave?: (articleId: string) => void
}

// Card notizia: mostra fonte, sentiment, testo, tag, entità e azioni rapide.
function MagicCard({ articleId, articleUrl, source, timeAgo, sentiment, title, summary, tags, entities, voteState, votePending = false, isSaved = false, savePending = false, onVoteChange, onSave }: MagicCardProps) {
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)

  useEffect(() => {
    if (savePending) {
      setShowSaveAnimation(true)
      const timer = setTimeout(() => setShowSaveAnimation(false), 500)
      return () => clearTimeout(timer)
    }
  }, [savePending])

  const handleVote = (clickedVote: 1 | -1) => {
    if (!articleId || votePending) return

    const nextVote = voteState === clickedVote ? null : clickedVote
    onVoteChange(articleId, nextVote)
  }

  const handleSave = () => {
    if (!articleId || savePending || !onSave) return
    onSave(articleId)
  }

  return (
    <article className="magic-card">
      {/* Testata card: fonte e badge del sentiment allineati ai lati opposti. */}
      <header className="magic-card-header">
        <div>
          <p className="magic-card-source">
            {source} • {timeAgo}
          </p>
        </div>
        <span className={`sentiment-badge ${sentiment.toLowerCase()}`}>{sentiment}</span>
      </header>

      {articleUrl ? (
        <h3 className="magic-card-title">
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="magic-card-title-link"
          >
            {title}
          </a>
        </h3>
      ) : (
        <h3 className="magic-card-title">{title}</h3>
      )}
      <p className="magic-card-summary">{summary}</p>

      {/* Tag tematici: servono a classificare velocemente la notizia. */}
      <div className="magic-card-tags">
        {tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>

      {/* Entità rilevate: evidenziano i nomi chiave citati nella notizia. */}
      <div className="magic-card-entities">
        <span className="entities-label">Entità:</span>
        <div className="chip-wrap">
          {entities.map((entity) => (
            <span key={entity} className="entity-chip">
              {entity}
            </span>
          ))}
        </div>
      </div>

      {/* Azioni rapide: pulsanti iconici per interagire con la card. */}
      <footer className="magic-card-actions" aria-label="Azioni notizia">
        <ActionButton
          label="Mi piace"
          tone="like"
          isActive={voteState === 1}
          onClick={() => handleVote(1)}
          disabled={votePending}
        >
          <ThumbUpIcon />
        </ActionButton>
        <ActionButton
          label="Non mi piace"
          tone="dislike"
          isActive={voteState === -1}
          onClick={() => handleVote(-1)}
          disabled={votePending}
        >
          <ThumbDownIcon />
        </ActionButton>
        <ActionButton label="Salva" tone="save" isActive={isSaved} onClick={handleSave} disabled={savePending} animating={showSaveAnimation}>
          <BookmarkIcon />
        </ActionButton>
      </footer>
    </article>
  )
}

// Piccolo bottone riutilizzabile per mantenere coerente il footer azioni.
function ActionButton({ label, tone, children, onClick, disabled, isActive, animating, style }: { label: string; tone: string; children: ReactNode; onClick?: () => void; disabled?: boolean; isActive?: boolean; animating?: boolean; style?: React.CSSProperties }) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (disabled) return
    onClick && onClick()
  }

  return (
    <button
      type="button"
      className={`action-button ${tone}${isActive ? ' active' : ''}${animating ? ' saving' : ''}`}
      aria-label={label}
      onClick={handleClick}
      disabled={disabled}
      style={style}
    >
      {disabled ? <span className="spinner" aria-hidden="true" /> : children}
    </button>
  )
}

function ThumbUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 11v10H4V11h3Zm3 10h7.5a2.5 2.5 0 0 0 2.45-2.02l1.03-5.48A2.5 2.5 0 0 0 18.53 10H13V5.5a2.5 2.5 0 0 0-5 0V11L10 21Z" />
    </svg>
  )
}

function ThumbDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 13V3H4v10h3Zm3-10h7.5a2.5 2.5 0 0 1 2.45 2.02l1.03 5.48A2.5 2.5 0 0 1 18.53 14H13v4.5a2.5 2.5 0 0 1-5 0V13L10 3Z" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3a2 2 0 0 0-2 2v16l8-4 8 4V5a2 2 0 0 0-2-2H6Z" />
    </svg>
  )
}

export default MagicCard

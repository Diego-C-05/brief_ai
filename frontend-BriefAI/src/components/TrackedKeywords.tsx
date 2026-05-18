type TrackedKeywordsProps = {
  keywords: string[]
  keywordInput: string
  onKeywordInputChange: (value: string) => void
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  onSaveKeywords: () => void
  isSaving?: boolean
}

const keywordSuggestions = ['OpenAI', 'Google AI', 'Anthropic', 'Tesla', 'SpaceX']

// Sezione keyword: permette di aggiungere, rimuovere e salvare le entità monitorate.
function TrackedKeywords({
  keywords,
  keywordInput,
  onKeywordInputChange,
  onAddKeyword,
  onRemoveKeyword,
  onSaveKeywords,
  isSaving = false,
}: TrackedKeywordsProps) {
  const handleSubmit = () => {
    onAddKeyword(keywordInput)
  }

  return (
    <section className="settings-card" aria-label="Parole chiave monitorate">
      <header className="settings-section-header">
        <div>
          <h2>Parole chiave monitorate</h2>
          <p>Monitora aziende, persone e temi con un tracciamento rapido.</p>
        </div>
      </header>

      <div className="keyword-toolbar">
        <input
          type="text"
          className="settings-keyword-input"
          placeholder="Aggiungi parola chiave..."
          value={keywordInput}
          onChange={(event) => onKeywordInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSubmit()
            }
          }}
        />
        <button type="button" className="keyword-add-button" onClick={handleSubmit}>
          <PlusIcon />
          Aggiungi
        </button>
      </div>

      <div className="suggestion-row" aria-label="Suggerimenti parole chiave">
        {keywordSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="suggestion-chip"
            onClick={() => onAddKeyword(suggestion)}
          >
            <span aria-hidden="true">+</span>
            {suggestion}
          </button>
        ))}
      </div>

      {keywords.length > 0 && (
        <div className="tracked-chip-wrap">
          {keywords.map((keyword) => (
            <span key={keyword} className="tracked-chip">
              {keyword}
              <button
                type="button"
                className="tracked-chip-remove"
                aria-label={`Rimuovi ${keyword}`}
                onClick={() => onRemoveKeyword(keyword)}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="settings-action-row">
        <button type="button" className={`settings-save-button${isSaving ? ' saving' : ''}`} onClick={onSaveKeywords} disabled={isSaving}>
          <SaveIcon />
          Salva
        </button>
      </div>
    </section>
  )
}

function PlusIcon() {
  return <span aria-hidden="true">+</span>
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Z" />
      <path d="M7 3v6h8V3" />
      <path d="M7 21v-6h10v6" />
    </svg>
  )
}

export default TrackedKeywords

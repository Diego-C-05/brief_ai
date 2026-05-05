type InterestPreferencesProps = {
  selectedMacroTopics: string[]
  onToggleMacroTopic: (topic: string) => void
  onSaveMacroTopics: () => void
}

type CategoryOption = {
  label: string
  emoji: string
}

const macroTopicOptions: CategoryOption[] = [
  { label: 'Intelligenza Artificiale', emoji: '🤖' },
  { label: 'Cybersecurity', emoji: '🔒' },
  { label: 'Business & Finanza', emoji: '💼' },
  { label: 'Politica & Geopolitica', emoji: '⚖️' },
  { label: 'Startup & Innovazione', emoji: '🚀' },
  { label: 'Software & Sviluppo', emoji: '💻' },
  { label: 'Scienza & Ricerca', emoji: '🔬' },
  { label: 'Energia & Ambiente', emoji: '🌱' },
  { label: 'Economia & Mercati', emoji: '📈' },
  { label: 'Social Media & Cultura', emoji: '📱' },
  { label: 'Salute & Medicina', emoji: '🏥' },
  { label: 'Trasporti & Mobilità', emoji: '🚗' },
]

// Sezione interessi: gestisce la selezione rapida delle categorie del feed.
function InterestPreferences({ selectedMacroTopics, onToggleMacroTopic, onSaveMacroTopics }: InterestPreferencesProps) {
  return (
    <section className="settings-card" aria-label="Le tue categorie">
      <header className="settings-section-header">
        <div>
          <h2>I tuoi Macro-Topics</h2>
          <p>Scegli i macro-temi che devono modellare il tuo feed.</p>
        </div>
      </header>

      <div className="category-grid">
        {macroTopicOptions.map((topic) => {
          const isSelected = selectedMacroTopics.includes(topic.label)

          return (
            <button
              key={topic.label}
              type="button"
              className={`category-tile ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleMacroTopic(topic.label)}
            >
              <span className="category-emoji" aria-hidden="true">
                {topic.emoji}
              </span>
              <span className="category-label">{topic.label}</span>
            </button>
          )
        })}
      </div>

      <div className="settings-action-row">
        <button type="button" className="settings-save-button" onClick={onSaveMacroTopics}>
          <SaveIcon />
          Salva
        </button>
      </div>
    </section>
  )
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

export default InterestPreferences

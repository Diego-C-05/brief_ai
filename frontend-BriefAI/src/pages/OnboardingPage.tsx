import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './OnboardingPage.css'

const TOPIC_OPTIONS = [
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
] as const

const SUGGESTIONS = ['OpenAI', 'Google AI', 'Anthropic', 'Tesla', 'SpaceX'] as const

function OnboardingPage() {
  const navigate = useNavigate()
  // Step corrente del wizard: 1 per categorie, 2 per tracking keyword.
  const [step, setStep] = useState<1 | 2>(1)
  // Stato accumulato dello step 1 (interessi selezionati).
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  // Stato accumulato dello step 2 (keyword da monitorare).
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  const progressPercent = step === 1 ? 50 : 100

  // Evita di mostrare nei suggerimenti keyword gia presenti nella lista personale.
  const suggestionPool = useMemo(
    () => SUGGESTIONS.filter((item) => !keywords.includes(item)),
    [keywords],
  )

  // Toggle atomico della card: se gia selezionata la rimuove, altrimenti la aggiunge.
  const toggleTopic = (topic: string) => {
    setSelectedTopics((prevTopics) =>
      prevTopics.includes(topic)
        ? prevTopics.filter((savedTopic) => savedTopic !== topic)
        : [...prevTopics, topic],
    )
  }

  const addKeyword = (rawValue: string) => {
    const cleanedKeyword = rawValue.trim()

    // Normalizzazione semplice: ignora vuoti e duplicati per mantenere la lista consistente.
    if (!cleanedKeyword || keywords.includes(cleanedKeyword)) {
      return
    }

    setKeywords((prevKeywords) => [...prevKeywords, cleanedKeyword])
    setKeywordInput('')
  }

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords((prevKeywords) =>
      prevKeywords.filter((savedKeyword) => savedKeyword !== keywordToRemove),
    )
  }

  const goToNextStep = () => {
    // Primo click su Continua: passa allo step 2 senza fare submit globale.
    if (step === 1) {
      setStep(2)
      return
    }

    // Salvataggio demo in localStorage: simula la persistenza prima del redirect
    // verso il form di registrazione. Nessuna chiamata al backend qui.
    localStorage.setItem(
      'briefai-onboarding',
      JSON.stringify({ selectedTopics, keywords }),
    )
    // Dopo il wizard, mostra il form di registrazione (pre-auth flow).
    navigate('/register')
  }

  return (
    <section className="onboarding-shell" aria-label="Configurazione iniziale BriefAI">
      <header className="progress-wrapper" aria-label="Progresso onboarding">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="progress-meta">
          <span>{`Passo ${step} di 2`}</span>
          <span>{`${progressPercent}%`}</span>
        </div>
      </header>

      {step === 1 ? (
        <article className="onboarding-card">
          <h1>A cosa sei interessato?</h1>
          <p className="subtitle">Seleziona tutte le categorie che ti interessano</p>

          <div className="topics-grid">
            {TOPIC_OPTIONS.map((topic) => {
              const isSelected = selectedTopics.includes(topic.label)

              return (
                <button
                  key={topic.label}
                  type="button"
                  className={`topic-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleTopic(topic.label)}
                >
                  <span className="topic-emoji" aria-hidden="true">
                    {topic.emoji}
                  </span>
                  <span>{topic.label}</span>
                  {isSelected && (
                    <span className="topic-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="onboarding-action"
            onClick={goToNextStep}
            disabled={selectedTopics.length === 0}
          >
            Continua
          </button>
        </article>
      ) : (
        <article className="onboarding-card">
          <h1>Tieni traccia di argomenti specifici</h1>
          <p className="subtitle">Aggiungi concorrenti, marchi o parole chiave da monitorare.</p>

          <input
            type="text"
            className="keyword-input"
            placeholder="Inserisci concorrenti, marchi, argomenti..."
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addKeyword(keywordInput)
              }
            }}
          />

          <section className="chip-section" aria-label="Suggerimenti">
            <h2>Suggerimenti</h2>
            <div className="chip-wrap">
              {suggestionPool.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => addKeyword(item)}
                >
                  <span aria-hidden="true">+</span>
                  {item}
                </button>
              ))}
            </div>
          </section>

          {keywords.length > 0 && (
            <section className="chip-section" aria-label="La tua lista di monitoraggio">
              <h2>La tua lista di monitoraggio</h2>
              <div className="chip-wrap">
                {keywords.map((keyword) => (
                  <span key={keyword} className="tracking-chip">
                    {keyword}
                    <button
                      type="button"
                      className="remove-chip"
                      onClick={() => removeKeyword(keyword)}
                      aria-label={`Rimuovi ${keyword}`}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="step-actions">
            <button type="button" className="secondary-action" onClick={() => setStep(1)}>
              Indietro
            </button>
            <button type="button" className="onboarding-action" onClick={goToNextStep}>
              Continua
            </button>
          </div>
        </article>
      )}
    </section>
  )
}

export default OnboardingPage

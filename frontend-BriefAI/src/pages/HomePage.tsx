import { Link } from 'react-router-dom'
import './HomePage.css'

function HomePage() {
  return (
    <section className="home-page" aria-label="Home pubblica BriefAI">
      <div className="home-container">
        {/* Hero principale: comunica il valore del prodotto in pochi secondi. */}
        <header className="hero-section">
          <p className="hero-badge">
            <SparklesIcon />
            <span>La tua intelligence sulle notizie potenziata dall'IA</span>
          </p>

          <h1>Ottieni notizie pronte all'azione in 30 secondi</h1>

          <p className="hero-subtitle">
            BriefAI trasforma il sovraccarico informativo in intelligence operativa. Riassunti
            generati dall'IA, analisi del sentiment e feed personalizzati per founder, analisti e
            appassionati di tecnologia.
          </p>

          <div className="plan-grid" aria-label="Piani disponibili">
            <article className="plan-card free-plan" aria-label="Piano gratuito">
              <span className="plan-chip">Free</span>
              <h2>Piano Gratuito</h2>
              <p>
                Inizia con il feed intelligente di base, riepiloghi rapidi e monitoraggio leggero
                dei trend principali.
              </p>
              <div className="plan-actions">
                <Link to="/login" className="plan-login-button">
                  Login
                </Link>
                <Link to="/onboarding" className="plan-register-button">
                  Registrati
                </Link>
              </div>
            </article>

            <article className="plan-card premium-plan" aria-label="Piano premium">
              <span className="plan-chip premium">Premium</span>
              <h2>Piano a Pagamento</h2>
              <p>
                Sblocca analisi avanzate, alert strategici, maggiore profondita di sentiment e
                tracciamento esteso di keyword e competitor.
              </p>
              <div className="plan-actions">
                <Link to="/login" className="plan-login-button">
                  Login
                </Link>
                <Link to="/onboarding" className="plan-register-button">
                  Registrati
                </Link>
              </div>
            </article>
          </div>
        </header>

        {/* Sezione benefici: tre card per descrivere le funzionalita principali. */}
        <section className="benefits-section" aria-label="Benefici principali">
          <article className="benefit-card">
            <div className="benefit-icon-wrap blue">
              <SparklesIcon />
            </div>
            <h3>Feed Personalizzato</h3>
            <p>
              L'IA impara i tuoi interessi e ti mostra solo cio che conta davvero. Monitora
              competitor, brand e temi emergenti in un unico flusso.
            </p>
          </article>

          <article className="benefit-card">
            <div className="benefit-icon-wrap violet">
              <ZapIcon />
            </div>
            <h3>Riassunti IA</h3>
            <p>
              Ogni articolo compresso in massimo 50 parole. Hai l'essenza senza rumore e recuperi
              ore preziose ogni giorno.
            </p>
          </article>

          <article className="benefit-card">
            <div className="benefit-icon-wrap green">
              <TrendingUpIcon />
            </div>
            <h3>Insight di Sentiment</h3>
            <p>
              Analisi istantanea del sentiment su ogni notizia. Comprendi rapidamente percezione di
              mercato e reputazione del brand.
            </p>
          </article>
        </section>

        {/* Anteprima prodotto: simula una card reale del feed per mostrare l'output. */}
        <section className="preview-section" aria-label="Anteprima applicazione">
          <h2>Guarda BriefAI in azione</h2>

          <div className="preview-shell">
            <article className="preview-card" aria-label="Demo articolo IA">
              <header className="preview-card-header">
                <span>TechCrunch • 2 ore fa</span>
                <span className="sentiment-badge">Positivo</span>
              </header>

              <h3>OpenAI annuncia un importante passo avanti nella sicurezza dell'IA</h3>

              <p>
                OpenAI introduce un nuovo framework di sicurezza che riduce del 60% gli output
                dannosi. I leader del settore elogiano l'approccio. Potrebbe diventare uno standard
                per i laboratori di IA.
              </p>

              <div className="preview-tags" aria-label="Tag articolo">
                <span className="tag-chip ai">IA</span>
                <span className="tag-chip openai">OpenAI</span>
                <span className="tag-chip safety">Sicurezza</span>
              </div>

              <footer className="preview-actions" aria-label="Azioni articolo">
                <span>👍 Mi piace</span>
                <span>💾 Salva</span>
              </footer>
            </article>
          </div>
        </section>

        <footer className="home-footer">BriefAI © 2026 - Strumento di Decision Intelligence</footer>
      </div>
    </section>
  )
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
      <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}

function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  )
}

export default HomePage

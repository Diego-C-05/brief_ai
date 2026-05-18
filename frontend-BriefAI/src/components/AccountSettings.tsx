type SubscriptionState = 'free' | 'pro'

type AccountSettingsProps = {
  username: string
  email: string
  subscriptionState: SubscriptionState
  subscriptionExpiresAt?: string | null
  onUpgrade: () => void
  onCancelSubscription: () => void
}

// Sezione account: mostra profilo e gestisce in modo condizionale il piano attivo.
function AccountSettings({username, email, subscriptionState, subscriptionExpiresAt, onUpgrade, onCancelSubscription}: AccountSettingsProps) {
  const isProPlan = subscriptionState === 'pro'
  const expires = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null

  return (
    <section className="settings-stack" aria-label="Profilo">
      <section className="settings-card" aria-label="Informazioni profilo">
        <header className="settings-section-header">
          <div>
            <h2>Informazioni profilo</h2>
            <p>Controlla i dati di base associati al tuo account.</p>
          </div>
        </header>

        <div className="profile-info-grid">
          <div>
            <span className="profile-info-label">Email</span>
            <p className="profile-info-value">{email}</p>
          </div>
          <div>
            <span className="profile-info-label">Nome utente</span>
            <p className="profile-info-value">{username}</p>
          </div>
        </div>
      </section>

      <section className="settings-card" aria-label="Gestione abbonamento">
        <header className="settings-section-header">
          <div>
            <h2>Gestione abbonamento</h2>
            <p>Gestisci il piano attualmente associato al tuo profilo.</p>
          </div>
        </header>

        <div className="subscription-box">
          <div className="subscription-copy">
            <span className={`plan-badge ${isProPlan ? 'pro' : 'free'}`}>
              {isProPlan ? 'Piano Pro' : 'Piano Gratuito'}
            </span>
            {isProPlan ? (
              <p>{expires ? `Scade il ${expires.toLocaleDateString()}` : 'Piano Pro attivo'}</p>
            ) : (
              <p>Passa al Pro per sbloccare monitoraggio e analisi avanzate.</p>
            )}
          </div>

          <div className="subscription-actions">
            {isProPlan ? (
              <button type="button" className="subscription-link-button" onClick={onCancelSubscription}>
                Annulla abbonamento
              </button>
            ) : (
              <button type="button" className="subscription-upgrade-button" onClick={onUpgrade}>
                Passa a Pro
              </button>
            )}
          </div>
        </div>
      </section>
    </section>
  )
}

export type { SubscriptionState }
export default AccountSettings

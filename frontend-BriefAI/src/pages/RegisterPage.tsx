import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/authService'
import './RegisterPage.css'

type RegisterPageProps = {
  onRegisterSuccess?: () => void
}

function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('briefai-register-draft')
      if (saved) {
        const { username: u, email: e, password: p, terms: t } = JSON.parse(saved)
        setUsername(u || '')
        setEmail(e || '')
        setNewPassword(p || '')
        setAcceptedTerms(t || false)
        localStorage.removeItem('briefai-register-draft')
      }
    } catch {
      // ignore
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Validazione esplicita: se i termini non sono accettati, blocca l'invio.
    if (!acceptedTerms) {
      setError("Devi accettare i Termini di servizio e l'Informativa sulla privacy.")
      return
    }

    // Recupera preferenze accumulate durante l'onboarding (se presenti)
    let macroTopics: string[] | undefined = undefined
    let keywords: string[] | undefined = undefined
    try {
      const raw = localStorage.getItem('briefai-onboarding')
      if (raw) {
        const parsed = JSON.parse(raw)
        macroTopics = parsed.selectedTopics || undefined
        keywords = parsed.keywords || undefined
      }
    } catch (e) {
      // ignore parsing errors
    }

    // Se non ha fatto onboarding, salva il form e redirige a onboarding
    if (!macroTopics || macroTopics.length === 0) {
      localStorage.setItem('briefai-register-draft', JSON.stringify({
        username,
        email,
        password: newPassword,
        terms: acceptedTerms,
      }))
      navigate('/onboarding')
      return
    }

    // Basic email format validation on client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(email).toLowerCase())) {
      setError('Formato email non valido.')
      return
    }

    try {
      await register({
        email,
        password: newPassword,
        username,
        preferences: {
          macroTopics,
          keywords,
        },
      })
      setError('')
      // Pulizia locale
      setUsername('')
      setEmail('')
      setNewPassword('')
      setAcceptedTerms(false)
      localStorage.removeItem('briefai-onboarding')
      localStorage.removeItem('briefai-newUser')
      if (typeof onRegisterSuccess === 'function') onRegisterSuccess()
      window.location.href = '/feed'
    } catch (err: any) {
      // Estrae il messaggio d'errore lanciato dal backend (`throw await res.json()`),
      // oppure mostra un fallback se l'API non risponde correttamente.
      const errorMessage = err?.error || err?.message || 'Errore nella registrazione'
      setError(errorMessage)
    }
  }

  return (
    <section className="auth-panel" aria-label="Registrazione BriefAI">
      <p className="eyebrow">BriefAI</p>
      <h1>Registrati</h1>
      <p className="subtitle">Crea il tuo account per iniziare.</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="register-username">Utente</label>
        <input
          id="register-username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Il tuo username"
          autoComplete="username"
          required
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@email.com"
          autoComplete="email"
          required
        />

        <label htmlFor="register-password">Nuova password</label>
        <input
          id="register-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Nuova password"
          autoComplete="new-password"
          required
        />

        <label className="checkbox-row" htmlFor="register-terms">
          <input
            id="register-terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          <span>Accetto i Termini di servizio e l'Informativa sulla privacy</span>
        </label>

        <button type="submit">Crea account</button>

        {error && (
          <p className="error" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </form>

      <p className="auth-footer">
        Se hai gia un account fai <Link className="text-link" to="/login">accesso</Link>
      </p>

      <p className="auth-footer">
        Torna alla <Link className="text-link" to="/">home</Link>
      </p>
    </section>
  )
}

export default RegisterPage

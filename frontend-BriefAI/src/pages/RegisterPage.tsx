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
  const getDraft = () => {
    try {
      const saved = localStorage.getItem('briefai-register-draft')
      if (!saved) return { username: '', email: '', password: '', terms: false }
      const parsed = JSON.parse(saved)
      return {
        username: parsed.username || '',
        email: parsed.email || '',
        password: parsed.password || '',
        terms: parsed.terms || false,
      }
    } catch {
      return { username: '', email: '', password: '', terms: false }
    }
  }

  const draft = getDraft()
  const [username, setUsername] = useState(draft.username)
  const [email, setEmail] = useState(draft.email)
  const [newPassword, setNewPassword] = useState(draft.password)
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(draft.terms)
  const [error, setError] = useState('')

  useEffect(() => {
    // Remove draft after we've read it during initialization
    try {
      localStorage.removeItem('briefai-register-draft')
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
    } catch {
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
    } catch (err: unknown) {
      // Estrae il messaggio d'errore lanciato dal backend (`throw await res.json()`),
      // oppure mostra un fallback se l'API non risponde correttamente.
      let errorMessage = 'Errore nella registrazione'
      if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object') {
        const maybe = err as Record<string, unknown>
        if (typeof maybe.error === 'string') errorMessage = maybe.error
        else if (typeof maybe.message === 'string') errorMessage = maybe.message
      }
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

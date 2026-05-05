import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import './LoginPage.css'

type LoginPageProps = {
  onLoginSuccess?: () => void
}

function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await login(email, password)
      setError('')
      if (typeof onLoginSuccess === 'function') onLoginSuccess()
      navigate('/feed')
    } catch (err: any) {
      setError('Credenziali non valide')
    }
  }

  return (
    <section className="auth-panel" aria-label="Accesso BriefAI">
      <p className="eyebrow">BriefAI</p>
      <h1>Accedi</h1>
      <p className="subtitle">Inserisci le tue credenziali per iniziare la configurazione.</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Inserisci la password"
          autoComplete="current-password"
          required
        />

        <p className="top-link-row">
            <a className="text-link" href="#" aria-label="Recupera password">
          Ti sei dimenticato la password?
        </a>
      </p>
        
        <button type="submit">Entra</button>

        {error && (
          <p className="error" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </form>

      <p className="auth-footer">
        Non hai un account? <Link className="text-link" to="/onboarding">Registrati</Link>
      </p>

      <p className="auth-footer">
        Vuoi tornare alla pagina iniziale? <Link className="text-link" to="/">Home</Link>
      </p>
    </section>
  )
}

export default LoginPage

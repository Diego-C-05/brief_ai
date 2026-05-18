import { useState } from 'react'
import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import FeedPage from './pages/FeedPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  // Stato minimo di autenticazione usato per abilitare/bloccare le route private.
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <main className="app-shell">
      <Routes>
        {/* Home pubblica: prima pagina visibile a utenti non autenticati. */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />}
        />
        {/* Route pubblica: consente la registrazione di un nuovo utente. */}
        <Route
          path="/register"
          element={<RegisterPage onRegisterSuccess={() => setIsAuthenticated(true)} />}
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
        {/* Compatibilita: vecchio path /home reindirizzato al nuovo onboarding. */}
        <Route path="/home" element={<Navigate to="/onboarding" replace />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        {/* Tendenze page rimossa */}
        <Route
          path="/impostazioni"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}

type ProtectedRouteProps = {
  isAuthenticated: boolean
  children: ReactElement
}

function ProtectedRoute({ isAuthenticated, children }: ProtectedRouteProps) {
  // Guard tecnica della route: se l'utente non e autenticato, verifica anche
  // la presenza di un token nel localStorage come fallback per evitare
  // condizioni di gara (es. subito dopo la registrazione).
  const token = localStorage.getItem('briefai_token')
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default App

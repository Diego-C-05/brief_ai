import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { decodeToken, getMe } from '../services/authService'

type FeedSidebarProps = {
  activeItem?: 'feed' | 'tendenze' | 'impostazioni'
}

// Sidebar principale del feed: gestisce brand, navigazione e blocco profilo.
const navigationItems = [
  { id: 'feed', label: 'Notizie', icon: LayoutDashboardIcon },
  { id: 'tendenze', label: 'Tendenze', icon: TrendingUpIcon },
  { id: 'impostazioni', label: 'Impostazioni', icon: SettingsIcon },
] as const

function FeedSidebar({ activeItem = 'feed' }: FeedSidebarProps) {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem('briefai_token')
      const payload = token ? decodeToken(token) : null

      if (payload?.email) {
        setUserEmail(String(payload.email))
      }

      try {
        const me = await getMe()
        const username = me?.user?.username
        const email = me?.user?.email

        if (username) setUserName(String(username))
        if (email) setUserEmail(String(email))
      } catch {
        // Ignore network/auth errors and keep available fallback values.
      }
    }

    void loadCurrentUser()
  }, [])

  const profileInitials = useMemo(() => {
    const sourceName = userName.trim()
    if (sourceName) {
      const parts = sourceName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)

      const initials = parts.map((part) => part[0]).join('')
      if (initials) return initials.toUpperCase()

      return sourceName.slice(0, 2).toUpperCase()
    }

    const emailPrefix = userEmail.trim().split('@')[0] ?? ''
    return emailPrefix.slice(0, 2).toUpperCase() || 'U'
  }, [userEmail, userName])

  return (
    <aside className="feed-sidebar" aria-label="Navigazione principale">
      {/* Logo BreafAI. */}
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <SparklesIcon />
        </div>
        <div className="brand-text">BriefAI</div>
      </div>

      {/* Menu di navigazione laterale. */}
      <nav className="sidebar-nav" aria-label="Menu notizie">
        {navigationItems.map((item) => {
          const isActive = item.id === activeItem
          const Icon = item.icon

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.id === 'feed' ? '/feed' : `/${item.id}`)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Box profilo: resta agganciato in basso. */}
      <div className="sidebar-profile">
        <div className="profile-avatar" aria-hidden="true">
          {profileInitials}
        </div>
        <div className="profile-meta">
          <strong>{userName || 'Utente'}</strong>
          <span>{userEmail || ''}</span>
        </div>
      </div>
    </aside>
  )
}

function SparklesIcon() {
  return <span aria-hidden="true">✦</span>
}

function LayoutDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.05.05a2 2 0 0 1-1.42 3.41 2 2 0 0 1-1.42-.59l-.06-.05a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.08a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.05a2 2 0 0 1-2.84-2.83l.05-.05A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.05-.05A2 2 0 0 1 5.64 3.72a2 2 0 0 1 1.42.59l.06.05a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.08a1.65 1.65 0 0 0 1 1.51h.06a1.65 1.65 0 0 0 1.82-.33l.06-.05a2 2 0 0 1 2.83 2.83l-.05.05A1.65 1.65 0 0 0 20.4 9H21a2 2 0 0 1 0 4h-.08a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export default FeedSidebar

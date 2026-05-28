import { useState, useEffect, useRef } from 'react'
import FeedSidebar from '../components/FeedSidebar'
import FeedTopbar from '../components/FeedTopbar'
import AccountSettings, { type SubscriptionState } from '../components/AccountSettings'
import InterestPreferences from '../components/InterestPreferences'
import SettingsTabs, { type SettingsTab } from '../components/SettingsTabs'
import TrackedKeywords from '../components/TrackedKeywords'
import './FeedPage.css'
import './SettingsPage.css'
import { fetchProfile, updateProfile } from '../services/apiService'

type SettingsSnapshot = {
  selectedMacroTopics: string[]
  keywords: string[]
  subscriptionState: SubscriptionState
  subscriptionExpiresAt?: string | null
}

type ProfileIdentity = {
  username: string
  email: string
}

const STORAGE_KEY = 'briefai-settings'
const ONBOARDING_KEY = 'briefai-onboarding'
const DEFAULT_MACRO_TOPICS = ['Scienza & Ricerca']

function readInitialSettings(): SettingsSnapshot {
  if (typeof window === 'undefined') {
    return {
      selectedMacroTopics: DEFAULT_MACRO_TOPICS,
      keywords: [],
      subscriptionState: 'free',
    }
  }

  const onboardingSnapshot = readJSON<{ selectedTopics?: string[]; keywords?: string[] }>(
    ONBOARDING_KEY,
  )
  const storedSnapshot = readJSON<Partial<SettingsSnapshot>>(STORAGE_KEY)

  return {
    selectedMacroTopics:
      storedSnapshot?.selectedMacroTopics ?? onboardingSnapshot?.selectedTopics ?? DEFAULT_MACRO_TOPICS,
    keywords: storedSnapshot?.keywords ?? onboardingSnapshot?.keywords ?? [],
    subscriptionState: storedSnapshot?.subscriptionState ?? 'free',
    subscriptionExpiresAt: storedSnapshot?.subscriptionExpiresAt ?? null,
  }
}

function readJSON<T>(storageKey: string): T | undefined {
  try {
    const rawValue = window.localStorage.getItem(storageKey)

    if (!rawValue) {
      return undefined
    }

    return JSON.parse(rawValue) as T
  } catch {
    return undefined
  }
}

function persistSettings(snapshot: SettingsSnapshot) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

// Pagina Impostazioni: gestisce preferenze feed e account con una struttura a tab.
function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('interests')
  const [animDirection, setAnimDirection] = useState<'ltr' | 'rtl' | null>(null)
  const prevTabRef = useRef<SettingsTab | null>(null)
  const [profileIdentity, setProfileIdentity] = useState<ProfileIdentity>({
    username: '',
    email: '',
  })
  const [selectedMacroTopics, setSelectedMacroTopics] = useState<string[]>(() =>
    readInitialSettings().selectedMacroTopics,
  )
  const [keywords, setKeywords] = useState<string[]>(() => readInitialSettings().keywords)
  const [keywordInput, setKeywordInput] = useState('')
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(
    () => readInitialSettings().subscriptionState,
  )
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(() =>
    readInitialSettings().subscriptionExpiresAt ?? null,
  )
  const [isSavingMacroTopics, setIsSavingMacroTopics] = useState(false)
  const [isSavingKeywords, setIsSavingKeywords] = useState(false)

  useEffect(() => {
    fetchProfile()
      .then((res) => {
        if (res && res.profile) {
          setProfileIdentity({
            username: res.profile.username || '',
            email: res.profile.email || '',
          })
          setSelectedMacroTopics(res.profile.macroTopics || [])
          setKeywords(res.profile.keywords || [])
          if (res.profile.subscriptionPlan) setSubscriptionState(res.profile.subscriptionPlan as SubscriptionState)
          setSubscriptionExpiresAt(res.profile.subscriptionExpiresAt || null)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const prev = prevTabRef.current
    if (prev && prev !== activeTab) {
      // From Interests -> Account: animate left-to-right (new content slides in from left)
      if (prev === 'interests' && activeTab === 'account') setAnimDirection('ltr')
      // From Account -> Interests: animate right-to-left
      if (prev === 'account' && activeTab === 'interests') setAnimDirection('rtl')

      // clear animation class after duration
      const t = setTimeout(() => setAnimDirection(null), 480)
      return () => clearTimeout(t)
    }
    prevTabRef.current = activeTab
    return undefined
  }, [activeTab])

  const handleToggleMacroTopic = (topic: string) => {
    // Toggle semplice: se la categoria esiste la rimuove, altrimenti la aggiunge.
    setSelectedMacroTopics((currentTopics) =>
      currentTopics.includes(topic)
        ? currentTopics.filter((savedTopic) => savedTopic !== topic)
        : [...currentTopics, topic],
    )
  }

  const handleSaveMacroTopics = async () => {
    setIsSavingMacroTopics(true)
    try {
      const res = await updateProfile({ macroTopics: selectedMacroTopics })
      if (res && res.profile) {
        setSelectedMacroTopics(res.profile.macroTopics || selectedMacroTopics)
      }
      persistSettings({ selectedMacroTopics, keywords, subscriptionState, subscriptionExpiresAt })
    } catch {
      // fallback local persist
      persistSettings({ selectedMacroTopics, keywords, subscriptionState, subscriptionExpiresAt })
    } finally {
      // Animazione dura 0.5s, poi reset
      setTimeout(() => setIsSavingMacroTopics(false), 500)
    }
  }

  const handleAddKeyword = (rawKeyword: string) => {
    const cleanedKeyword = rawKeyword.trim()

    // Evita duplicati e valori vuoti per mantenere la lista leggibile.
    if (!cleanedKeyword || keywords.includes(cleanedKeyword)) {
      return
    }

    setKeywords((currentKeywords) => [...currentKeywords, cleanedKeyword])
    setKeywordInput('')
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords((currentKeywords) =>
      currentKeywords.filter((savedKeyword) => savedKeyword !== keywordToRemove),
    )
  }

  const handleSaveKeywords = async () => {
    setIsSavingKeywords(true)
    try {
      const res = await updateProfile({ keywords })
      if (res && res.profile) {
        setKeywords(res.profile.keywords || keywords)
      }
      persistSettings({ selectedMacroTopics, keywords, subscriptionState, subscriptionExpiresAt })
    } catch {
      persistSettings({ selectedMacroTopics, keywords, subscriptionState, subscriptionExpiresAt })
    } finally {
      // Animazione dura 0.5s, poi reset
      setTimeout(() => setIsSavingKeywords(false), 500)
    }
  }

  const handleUpgrade = async () => {
    try {
      const res = await updateProfile({ subscriptionState: 'pro' })
      if (res && res.profile) {
        setSubscriptionState((res.profile.subscriptionPlan as SubscriptionState) || 'pro')
        setSubscriptionExpiresAt(res.profile.subscriptionExpiresAt || null)
        persistSettings({ selectedMacroTopics, keywords, subscriptionState: (res.profile.subscriptionPlan as SubscriptionState) || 'pro', subscriptionExpiresAt: res.profile.subscriptionExpiresAt || null })
      }
    } catch {
      // fallback local only
      const nextSubscriptionState: SubscriptionState = 'pro'
      setSubscriptionState(nextSubscriptionState)
      setSubscriptionExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      persistSettings({ selectedMacroTopics, keywords, subscriptionState: nextSubscriptionState, subscriptionExpiresAt })
    }
  }

  const handleCancelSubscription = async () => {
    try {
      const res = await updateProfile({ subscriptionState: 'free' })
      if (res && res.profile) {
        setSubscriptionState((res.profile.subscriptionPlan as SubscriptionState) || 'free')
        setSubscriptionExpiresAt(res.profile.subscriptionExpiresAt || null)
        persistSettings({ selectedMacroTopics, keywords, subscriptionState: (res.profile.subscriptionPlan as SubscriptionState) || 'free', subscriptionExpiresAt: res.profile.subscriptionExpiresAt || null })
      }
    } catch {
      const nextSubscriptionState: SubscriptionState = 'free'
      setSubscriptionState(nextSubscriptionState)
      setSubscriptionExpiresAt(null)
      persistSettings({ selectedMacroTopics, keywords, subscriptionState: nextSubscriptionState, subscriptionExpiresAt })
    }
  }

  return (
    <div className="feed-layout settings-layout" aria-label="Impostazioni BriefAI">
      <FeedSidebar activeItem="impostazioni" />

      <section className="feed-main settings-main">
        <FeedTopbar />

        <div className="feed-content settings-content">
          <header className="settings-header">
            <h1>Impostazioni</h1>
            <p>Gestisci preferenze e profilo</p>
          </header>

          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className={`settings-panels ${animDirection ? `anim-${animDirection}` : ''}`}>
            {activeTab === 'interests' ? (
              <div className="settings-panel" key="interests">
                <InterestPreferences
                  selectedMacroTopics={selectedMacroTopics}
                  onToggleMacroTopic={handleToggleMacroTopic}
                  onSaveMacroTopics={handleSaveMacroTopics}
                  isSaving={isSavingMacroTopics}
                />
                <TrackedKeywords
                  keywords={keywords}
                  keywordInput={keywordInput}
                  onKeywordInputChange={setKeywordInput}
                  onAddKeyword={handleAddKeyword}
                  onRemoveKeyword={handleRemoveKeyword}
                  onSaveKeywords={handleSaveKeywords}
                  isSaving={isSavingKeywords}
                />
              </div>
            ) : (
              <div className="settings-panel" key="account">
                <AccountSettings
                  username={profileIdentity.username || 'Utente'}
                  email={profileIdentity.email || 'Email non disponibile'}
                  subscriptionState={subscriptionState}
                  subscriptionExpiresAt={subscriptionExpiresAt}
                  onUpgrade={handleUpgrade}
                  onCancelSubscription={handleCancelSubscription}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
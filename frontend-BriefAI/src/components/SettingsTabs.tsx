type SettingsTab = 'interests' | 'account'

type SettingsTabsProps = {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const tabItems: Array<{ id: SettingsTab; label: string }> = [
  { id: 'interests', label: 'Interessi' },
  { id: 'account', label: 'Profilo' },
]

// Tabs di Settings: servono per separare preferenze feed e dati account.
function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="settings-tabs" role="tablist" aria-label="Schede impostazioni">
      {tabItems.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export type { SettingsTab }
export default SettingsTabs

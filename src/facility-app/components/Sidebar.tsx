import { Icon, type IconName } from './Icon'

const navigation: { label: string; icon: IconName }[] = [
  { label: 'Faults', icon: 'nav-faults' },
  { label: 'Sites', icon: 'nav-sites' },
  { label: 'Plans', icon: 'nav-plans' },
  { label: 'Logs', icon: 'nav-logs' },
]

export function Sidebar() {
  return (
    <aside className="sidebar" data-geometry="sidebar" aria-label="Application sidebar">
      <div className="workspace-bar">
        <button className="workspace-button" type="button" aria-label="Afterhours workspace" aria-disabled="true">
          <span className="brand-tile raised-surface">
            <span className="brand-logo-slot"><img src="/facility-app/assets/figma/afterhours-logomark.svg" alt="" /></span>
          </span>
          <span>Afterhours</span>
        </button>
        <button type="button" className="notification-button" aria-label="Notifications" aria-disabled="true">
          <Icon name="notifications" />
        </button>
      </div>
      <nav className="side-navigation" aria-label="Main navigation">
        {navigation.map(({ label, icon }) => (
          <button key={label} type="button" className={`nav-item${label === 'Sites' ? ' is-active' : ''}`}
            aria-current={label === 'Sites' ? 'page' : undefined} aria-disabled="true">
            <Icon name={icon} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <button type="button" className="account-area" data-geometry="account" aria-label="Andrew account" aria-disabled="true">
        <span className="avatar raised-surface">A</span><span>Andrew</span>
      </button>
    </aside>
  )
}

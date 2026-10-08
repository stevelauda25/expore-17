import { Icon, type IconName } from './Icon'
import { Popover, type PopoverState } from './Popover'
export type Navigation = 'Faults' | 'Sites' | 'Plans' | 'Logs'
const navigation: { label: Navigation; icon: IconName }[] = [
  { label: 'Faults', icon: 'nav-faults' }, { label: 'Sites', icon: 'nav-sites' },
  { label: 'Plans', icon: 'nav-plans' }, { label: 'Logs', icon: 'nav-logs' },
]
export function Sidebar({ activeNav, onNavigate, popovers, onNotice }: { activeNav: Navigation; onNavigate: (nav: Navigation) => void; popovers: PopoverState; onNotice: (text: string) => void }) {
  return <aside className="sidebar" data-geometry="sidebar" aria-label="Application sidebar">
    <div className="workspace-bar">
      <Popover name="workspace" state={popovers} label="Workspace" menu trigger={props => <button {...props} className="workspace-button" type="button" aria-label="Afterhours workspace">
        <span className="brand-tile raised-surface"><span className="brand-logo-slot"><img src="/facility-app/assets/figma/afterhours-logomark.svg" alt="" /></span></span><span>Afterhours</span>
      </button>}>{close => <>{['Afterhours', 'Cedar Campus', 'Account settings'].map(label => <button type="button" role="menuitem" key={label} onClick={() => { onNotice(`${label} · prototype workspace action`); close() }}>{label}</button>)}</>}</Popover>
      <Popover name="notifications" state={popovers} label="Notifications" trigger={props => <button {...props} type="button" className="notification-button" aria-label="Notifications"><Icon name="notifications" /></button>}>
        {() => <><h2>1 unresolved finding</h2><p>AHU-03 override may still be active.</p></>}
      </Popover>
    </div>
    <nav className="side-navigation" aria-label="Main navigation">{navigation.map(({ label, icon }) => <button key={label} type="button" className={`nav-item${label === activeNav ? ' is-active' : ''}`} aria-current={label === activeNav ? 'page' : undefined} onClick={() => onNavigate(label)}><Icon name={icon} /><span>{label}</span></button>)}</nav>
    <Popover name="account" state={popovers} label="Andrew account" menu placement="top-start" trigger={props => <button {...props} type="button" className="account-area" data-geometry="account" aria-label="Andrew account"><span className="avatar raised-surface">A</span><span>Andrew</span></button>}>
      {close => <><h2>Andrew</h2>{['Profile', 'Preferences', 'Sign out'].map(label => <button type="button" role="menuitem" key={label} onClick={() => { onNotice(`${label} · prototype only; no account changes made`); close() }}>{label}</button>)}</>}
    </Popover>
  </aside>
}

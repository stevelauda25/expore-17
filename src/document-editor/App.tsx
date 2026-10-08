import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { Icon, Orb } from './components/SourceAsset'
import type { IconName } from './components/SourceAsset'
import { Emblem } from './components/Emblem'
import styles from './App.module.css'

export interface Runtime {
  panelOpen: boolean
  bannerOpen: boolean
  tab: 'Explain' | 'Comments' | 'History'
  setTab: (tab: 'Explain' | 'Comments' | 'History') => void
  closePanel: () => void
  dismissBanner: () => void
  comments: ReactNode
  history: ReactNode
  search: ReactNode
  outline: ReactNode
  saveControls: ReactNode
  document: ReactNode
  notice: ReactNode
  title: string
  outlineOpen: boolean
  explainMode: boolean
  toggleExplain: (trigger: HTMLButtonElement) => void
  toggleOutline: () => void
  navigate: (destination: string) => void
}
const railItems: { label: string; icon: IconName | 'orb' }[] = [
  { label: 'Home', icon: 'home' }, { label: 'Documents', icon: 'document' },
  { label: 'Scan', icon: 'scan' }, { label: 'Calendar', icon: 'calendar' },
  { label: 'Explain mode', icon: 'orb' }, { label: 'Library', icon: 'library' },
]

function Rail({ runtime }: { runtime: Runtime }) {
  return <nav className={styles.rail} aria-label="Application">
    <div className={styles.railHeader}><button aria-label="Toggle outline" aria-expanded={runtime.outlineOpen} onClick={runtime.toggleOutline}><Icon name="outline" /></button></div>
    <div className={styles.railBody}>{railItems.map((item, index) => <button key={item.label} aria-label={item.label} aria-pressed={item.icon === 'orb' ? runtime.explainMode : undefined} data-explain-trigger={item.icon === 'orb' ? '' : undefined} onClick={event => item.icon === 'orb' ? runtime.toggleExplain(event.currentTarget) : runtime.navigate(item.label)} className={`${styles.railButton} ${index === 0 ? styles.railActive : ''}`}>
      {item.icon === 'orb' ? <Orb /> : <Icon name={item.icon} />}
    </button>)}<button className={`${styles.railButton} ${styles.settings}`} aria-label="Settings" onClick={() => runtime.navigate('Settings')}><Icon name="settings" /></button></div>
  </nav>
}

function DocumentControls({ runtime }: { runtime: Runtime }) {
  return <header className={styles.controls} data-testid="document-controls">
    <div className={styles.documentTitle}><div className={styles.documentIcon}><Icon name="document-title" /></div><p><strong>{runtime.title} · </strong><span>Draft</span></p></div>
    <div className={styles.saveControls}>
      {runtime.saveControls}
    </div>
  </header>
}

export default function App({ runtime, workspaceRef }: { runtime: Runtime; workspaceRef: Ref<HTMLDivElement> }) {
  const tabs = ['Explain', 'Comments', 'History'] as const
  const tab = runtime.tab
  const navigateTabs = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = tabs.indexOf(tab)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3
    runtime.setTab(tabs[next])
    document.getElementById(`tab-${tabs[next]}`)?.focus()
  }
  return <div className={styles.presentation}>
    <div className={`${styles.shell} ${!runtime.outlineOpen ? styles.outlineCollapsed : ''} ${!runtime.panelOpen ? styles.panelCollapsed : ''}`} data-testid="app-shell">
      <Rail runtime={runtime} />
      <header className={styles.topbar} data-testid="topbar">
        <div className={styles.breadcrumb}><button onClick={() => runtime.navigate('Home')}>Home</button><Icon name="chevron" /><span>Create documents</span></div>
        {runtime.search}
      </header>
      <nav className={styles.outline} aria-label="Document outline" data-testid="outline">
        {runtime.outline}
      </nav>
      <DocumentControls runtime={runtime} />
      <div className={styles.workspace} ref={workspaceRef} tabIndex={0} aria-label="Document workspace" data-testid="workspace">
        <div className={styles.banner} hidden={!runtime.bannerOpen} data-testid="editing-banner"><Icon name="edit" /><p>You are editing this document. Click anywhere to type. Changes save automatically.</p><button aria-label="Dismiss editing banner" onClick={runtime.dismissBanner}><Icon name="close-banner" /></button></div>
        {runtime.document}
      </div>
      <aside hidden={!runtime.panelOpen} className={styles.panel} aria-label="Document tools" data-testid="right-panel">
        <div className={styles.tabs} data-testid="tabs"><div className={styles.tabLabels} role="tablist" aria-label="Document tools" onKeyDown={navigateTabs}>
          {tabs.map(label => <button role="tab" id={`tab-${label}`} aria-controls={`panel-${label}`} tabIndex={label === tab ? 0 : -1} aria-selected={label === tab} data-document-tab key={label} onClick={() => runtime.setTab(label)}>{label}</button>)}
        </div><span className={`${styles.tabLine} ${tab !== 'Explain' ? styles.secondaryTabLine : ''}`} data-active-tab={tab}>{tab === 'Explain' && <Icon name="tab-line" />}</span><button aria-label="Close document tools" onClick={runtime.closePanel}><Icon name="close-panel" /></button></div>
        <div id="panel-Explain" hidden={tab !== 'Explain'} className={styles.emptyState} role="tabpanel" aria-labelledby="tab-Explain" tabIndex={0}>
          <div className={styles.emptyContent} data-testid="empty-state"><Emblem /><div className={styles.emptyText}><p>Click any clause to explain it</p><p>Hover any paragraph, then click Explain to understand it instantly</p></div></div>
        </div>
        {<><div id="panel-Comments" role="tabpanel" aria-labelledby="tab-Comments" tabIndex={0} hidden={tab !== 'Comments'} className={styles.toolPanel}>{runtime.comments}</div><div id="panel-History" role="tabpanel" aria-labelledby="tab-History" tabIndex={0} hidden={tab !== 'History'} className={styles.toolPanel}>{runtime.history}</div></>}
      </aside>
    </div>
    {runtime.notice}
  </div>
}

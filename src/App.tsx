import { lazy, Suspense, useState } from 'react'
import { DatePickerDemo } from './components/date-picker/DatePickerDemo'
import { ProfileDemo } from './components/profile/ProfileDemo'
import { ExplorationSwitcher } from './components/ExplorationSwitcher'
import type { Exploration } from './components/ExplorationSwitcher'
import { HeaderDemo } from './components/header/HeaderDemo'

const DocumentEditorDemo = lazy(() => import('./document-editor/DocumentEditorDemo'))

export default function App() {
  const [exploration, setExploration] = useState<Exploration>('header')
  const [editorVisited, setEditorVisited] = useState(false)
  const switchExploration = (next: Exploration) => {
    if (next === 'document-editor') setEditorVisited(true)
    setExploration(next)
  }

  return (
    <main className={`exploration-page exploration-page--${exploration}`}>
      <section
        id="exploration-panel-header"
        className="exploration-panel"
        role="tabpanel"
        aria-labelledby="exploration-tab-header"
        hidden={exploration !== 'header'}
        tabIndex={0}
      >
        {exploration === 'header' && <HeaderDemo />}
      </section>
      <DatePickerDemo active={exploration === 'date-picker'} />
      <ProfileDemo active={exploration === 'profile'} />
      <section id="exploration-panel-document-editor" className="exploration-panel document-editor-panel" role="tabpanel" aria-labelledby="exploration-tab-document-editor" hidden={exploration !== 'document-editor'} inert={exploration !== 'document-editor'} tabIndex={0}>
        {editorVisited && <Suspense fallback={<p className="document-editor-loading" role="status">Loading document editor…</p>}><DocumentEditorDemo active={exploration === 'document-editor'} /></Suspense>}
      </section>
      <ExplorationSwitcher value={exploration} onChange={switchExploration} />
    </main>
  )
}

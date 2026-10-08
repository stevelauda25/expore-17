import { lazy, Suspense, useEffect, useState } from 'react'
import { DatePickerDemo } from './components/date-picker/DatePickerDemo'
import { ProfileDemo } from './components/profile/ProfileDemo'
import { ExplorationSwitcher } from './components/ExplorationSwitcher'
import type { Exploration } from './components/ExplorationSwitcher'
import { HeaderDemo } from './components/header/HeaderDemo'

const DocumentEditorDemo = lazy(() => import('./document-editor/DocumentEditorDemo'))

const ProductUsageDemo = lazy(() => import('./product-usage/ProductUsageDemo'))

const FacilityAppDemo = lazy(() => import('./facility-app/FacilityAppDemo'))

export default function App() {
  const [switcherVisible, setSwitcherVisible] = useState(true)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey && event.shiftKey && event.key.toLowerCase() === 'c' && !event.repeat) {
        event.preventDefault()
        setSwitcherVisible(current => !current)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [exploration, setExploration] = useState<Exploration>('header')
  const [editorVisited, setEditorVisited] = useState(false)
  const [productUsageVisited, setProductUsageVisited] = useState(false)
  const [facilityVisited, setFacilityVisited] = useState(false)
  const switchExploration = (next: Exploration) => {
    if (next === 'document-editor') setEditorVisited(true)
    if (next === 'product-usage') setProductUsageVisited(true)
    if (next === 'facility-app') setFacilityVisited(true)
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
      <section id="exploration-panel-facility-app" className="exploration-panel facility-app-panel" role="tabpanel" aria-labelledby="exploration-tab-facility-app" hidden={exploration !== 'facility-app'} inert={exploration !== 'facility-app'} tabIndex={0}>
        {facilityVisited && <Suspense fallback={<p className="facility-app-loading" role="status">Loading Facility app…</p>}><FacilityAppDemo active={exploration === 'facility-app'} /></Suspense>}
      </section>
      <section id="exploration-panel-product-usage" className="exploration-panel product-usage-panel" role="tabpanel" aria-labelledby="exploration-tab-product-usage" hidden={exploration !== 'product-usage'} inert={exploration !== 'product-usage'} tabIndex={0}>
        {productUsageVisited && <Suspense fallback={<p className="product-usage-loading" role="status">Loading Product usage…</p>}><ProductUsageDemo active={exploration === 'product-usage'} /></Suspense>}
      </section>
      {switcherVisible && <ExplorationSwitcher value={exploration} onChange={switchExploration} />}
    </main>
  )
}

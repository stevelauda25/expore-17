import { useRef, useState } from 'react'
import { InspectionDrawer } from './components/InspectionDrawer'
import type { PopoverName } from './components/Popover'
import type { Navigation } from './components/Sidebar'
import { AppShell } from './components/AppShell'
import { MetricSummary } from './components/MetricSummary'
import { RuntimeHeatmap } from './components/RuntimeHeatmap'
import { ContextPanel } from './components/ContextPanel'
import { defaultEquipment, equipment } from './data/equipment'

export default function App({ active }: { active: boolean }) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(defaultEquipment.id)
  const [activeNav, setActiveNav] = useState<Navigation>('Sites')
  const [openPopover, setOpenPopover] = useState<PopoverName>(null)
  const [inspectionDrawerOpen, setInspectionDrawerOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [wasActive, setWasActive] = useState(active)
  // Reset transient UI before rendering a hidden host panel; preserve equipment/navigation.
  if (wasActive !== active) {
    setWasActive(active)
    setOpenPopover(null)
    setInspectionDrawerOpen(false)
    setNotice('')
  }
  const inspectTrigger = useRef<HTMLButtonElement>(null)
  const selectedEquipment = equipment.find(item => item.id === selectedEquipmentId) ?? defaultEquipment
  const popovers = { openPopover, setOpenPopover }
  const navigate = (nav: Navigation) => { setActiveNav(nav); setOpenPopover(null); setNotice('') }

  return (
    <AppShell selected={selectedEquipment} sidebar={{ activeNav, onNavigate: navigate, popovers, onNotice: setNotice }}
      onBreadcrumb={label => { navigate('Sites'); setNotice(`${label} · Facilities overview`) }}
      onInspect={() => { setOpenPopover(null); setInspectionDrawerOpen(true) }} inspectTrigger={inspectTrigger}>
      {notice && <div className="facility-notice" role="status">{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
      {activeNav !== 'Sites' ? <section className="facility-placeholder"><h1>{activeNav}</h1><p>This destination is a local prototype. Continue reviewing equipment in Sites.</p><button type="button" onClick={() => navigate('Sites')}>Return to Sites</button></section> : <>
      <header className="page-heading" data-geometry="page-heading">
        <h1>Where is equipment running after hours?</h1>
        <p className="secondary">Week of 28 Sep – 04 Oct 2026 · 15-minute telemetry · Last sync 06 Oct, 08:10</p>
      </header>
      <div className="dashboard-columns">
        <div className="runtime-column">
          <MetricSummary />
          <RuntimeHeatmap selected={selectedEquipment} onSelect={setSelectedEquipmentId} />
        </div>
        <ContextPanel selected={selectedEquipment} popovers={popovers} />
      </div>
      </>}
      {active && inspectionDrawerOpen && <InspectionDrawer selected={selectedEquipment} onClose={() => setInspectionDrawerOpen(false)} trigger={inspectTrigger} />}
    </AppShell>
  )
}

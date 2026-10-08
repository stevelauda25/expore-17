import { AppShell } from './components/AppShell'
import { MetricSummary } from './components/MetricSummary'
import { RuntimeHeatmap } from './components/RuntimeHeatmap'
import { ContextPanel } from './components/ContextPanel'
import { defaultEquipment } from './data/equipment'

export default function App() {
  return (
    <AppShell selected={defaultEquipment}>
      <header className="page-heading" data-geometry="page-heading">
        <h1>Where is equipment running after hours?</h1>
        <p className="secondary">Week of 28 Sep – 04 Oct 2026 · 15-minute telemetry · Last sync 06 Oct, 08:10</p>
      </header>
      <div className="dashboard-columns">
        <div className="runtime-column">
          <MetricSummary />
          <RuntimeHeatmap selected={defaultEquipment} />
        </div>
        <ContextPanel selected={defaultEquipment} />
      </div>
    </AppShell>
  )
}

import type { Equipment } from '../data/equipment'
import { Icon } from './Icon'

function FindingCard() {
  return (
    <section className="finding-card" data-geometry="finding" aria-labelledby="facility-finding-title">
      <div className="finding-rings" aria-hidden="true">
        <img className="finding-ring ring-outer" src="/facility-app/assets/figma/finding-ring-outer.png" alt="" />
        <img className="finding-ring ring-middle" src="/facility-app/assets/figma/finding-ring-middle.png" alt="" />
        <img className="finding-ring ring-inner" src="/facility-app/assets/figma/finding-ring-inner.png" alt="" />
        <img className="finding-ring ring-center" src="/facility-app/assets/figma/finding-ring-center.png" alt="" />
      </div>
      <p className="finding-eyebrow icon-label"><Icon name="finding-sparkles" />AI-finding</p>
      <h2 id="facility-finding-title">Check an old override</h2>
      <div className="finding-description">
        <p>AHU-03 is the largest outlier. Event override OV-882</p>
        <p>was enabled on 22 Sep and has no end timestamp.</p>
      </div>
      <button className="control-log-button" type="button" aria-disabled="true">
        <Icon name="control-log" /><span>Control log CL-203</span><Icon name="expand" />
      </button>
    </section>
  )
}

function EquipmentContext({ selected }: { selected: Equipment }) {
  return (
    <section className="equipment-context card" data-geometry="equipment-context" aria-labelledby="facility-equipment-title">
      <h2 id="facility-equipment-title" className="context-heading icon-label"><Icon name="nav-sites" />Selected: {selected.area}</h2>
      <div className="equipment-details">
        <p className="medium">{selected.id} · {selected.equipmentType}</p>
        <p className="booked-hours secondary">Booked hours: {selected.bookedHours}</p>
      </div>
      <p className="coverage icon-label"><Icon name="coverage" />Data coverage: {selected.coverage}% of intervals</p>
    </section>
  )
}

function ReviewContext() {
  return (
    <section className="review-context card" data-geometry="review-context" aria-labelledby="facility-review-title">
      <h2 id="facility-review-title" className="context-heading icon-label"><Icon name="review-context" />Review context</h2>
      <div className="review-details">
        <div className="review-item">
          <h3 className="icon-label"><Icon name="weather" />Weather matched</h3>
          <p className="secondary">Baseline uses comparable outdoor temperatures and occupancy.</p>
        </div>
        <div className="review-item">
          <h3 className="icon-label"><Icon name="unverified" />Cause not yet verified</h3>
          <p className="secondary">A mechanical fault can resemble a schedule problem. Inspect the signal.</p>
        </div>
      </div>
    </section>
  )
}

export function ContextPanel({ selected }: { selected: Equipment }) {
  return (
    <aside className="context-panel" aria-label="Equipment findings and context">
      <FindingCard />
      <EquipmentContext selected={selected} />
      <ReviewContext />
    </aside>
  )
}

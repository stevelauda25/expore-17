import type { Equipment } from '../data/equipment'
import { Icon } from './Icon'

export function BottomActionBar({ selected }: { selected: Equipment }) {
  return (
    <footer className="bottom-bar" data-geometry="bottom-bar">
      <p>Selected: {selected.id} · {selected.area}</p>
      <button className="inspect-button raised-surface" type="button" aria-disabled="true">
        <span>Inspect {selected.id}</span><Icon name="inspect-arrow" />
      </button>
    </footer>
  )
}

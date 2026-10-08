import type { RefObject } from 'react'
import type { Equipment } from '../data/equipment'
import { Icon } from './Icon'

export function BottomActionBar({ selected, onInspect, trigger }: { selected: Equipment; onInspect: () => void; trigger: RefObject<HTMLButtonElement | null> }) {
  return (
    <footer className="bottom-bar" data-geometry="bottom-bar">
      <p>Selected: {selected.id} · {selected.area}</p>
      <button className="inspect-button raised-surface" type="button" ref={trigger} onClick={onInspect} aria-haspopup="dialog">
        <span>Inspect {selected.id}</span><Icon name="inspect-arrow" />
      </button>
    </footer>
  )
}

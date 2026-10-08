import { useState } from 'react'
import { autoUpdate, flip, offset, shift, useDismiss, useFloating, useFocus, useHover, useInteractions, useRole } from '@floating-ui/react'
import type { Equipment } from '../data/equipment'

export function HeatmapCell({ item, day, hours, onSelect }: { item: Equipment; day: string; hours: number; onSelect: () => void }) {
  const [open, setOpen] = useState(false)
  const text = `${item.id} / ${day} / ${hours} ${hours === 1 ? 'hr' : 'hrs'} after schedule`
  const { refs: { setReference, setFloating }, floatingStyles, context } = useFloating({ open, onOpenChange: setOpen, placement: 'top', strategy: 'fixed', whileElementsMounted: autoUpdate, middleware: [offset(6), flip(), shift({ padding: 8 })] })
  const { getReferenceProps, getFloatingProps } = useInteractions([useHover(context, { move: false }), useFocus(context, { visibleOnly: false }), useDismiss(context), useRole(context, { role: 'tooltip' })])
  return <td ref={setReference} className="runtime-cell raised-surface" data-runtime={hours} tabIndex={0}
    {...getReferenceProps({ 'aria-label': text, onKeyDown(event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect() } } })}>
    <span>{hours}</span>
    {open && <span ref={setFloating} style={floatingStyles} {...getFloatingProps({ className: 'facility-tooltip' })}>{text}</span>}
  </td>
}

import { useEffect, useRef, type RefObject } from 'react'
import { days, type Equipment } from '../data/equipment'

export function InspectionDrawer({ selected, onClose, trigger }: { selected: Equipment; onClose: () => void; trigger: RefObject<HTMLButtonElement | null> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current!
    const returnTarget = trigger.current
    element.showModal()
    return () => { element.close(); if (returnTarget?.closest('[data-facility-active="true"]')) returnTarget.focus() }
  }, [trigger])
  return <dialog ref={dialog} className="inspection-drawer" aria-labelledby="facility-inspect-title" onKeyDown={event => {
      if (event.key !== 'Tab') return
      const controls = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="inspection-heading"><div><p className="secondary">Equipment inspection</p><h2 id="facility-inspect-title">{selected.id} · {selected.area}</h2></div><button type="button" onClick={onClose} aria-label="Close inspection">×</button></header>
    <p>{selected.equipmentType}</p>
    <p className="secondary">{selected.prototypeContext ? 'Local prototype context · not live telemetry' : 'Prototype inspection · cause not yet verified'}</p>
    <section><h3>Context</h3><p>{selected.inspectionSummary}</p></section>
    <section><h3>Booked schedule</h3><p>{selected.bookedHours}</p></section>
    <section><h3>Daily runtime after schedule</h3><dl className="inspection-runtime">{days.map((day, index) => <div key={day}><dt>{day}</dt><dd>{selected.dailyRuntime[index]} hrs</dd></div>)}</dl></section>
    <section><h3>Suspected issue</h3><p>{selected.suspectedIssue}</p></section>
    <dl className="inspection-facts"><div><dt>Excess kWh/week</dt><dd>{selected.excessKwh}</dd></div><div><dt>Data coverage</dt><dd>{selected.coverage}% of intervals</dd></div>
      {selected.controlLog && <><div><dt>Control log</dt><dd>{selected.controlLog.id}</dd></div><div><dt>Override</dt><dd>{selected.controlLog.override}</dd></div><div><dt>Enabled</dt><dd>{selected.controlLog.enabled}</dd></div><div><dt>End timestamp</dt><dd>{selected.controlLog.endTimestamp}</dd></div><div><dt>Source</dt><dd>{selected.controlLog.source}</dd></div></>}
    </dl>
  </dialog>
}

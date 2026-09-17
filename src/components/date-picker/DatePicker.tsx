import { useEffect, useRef, useState } from 'react'
import { NotePopover } from './NotePopover'
import { rangeSegments } from './range-segments'
import {
  PRESETS, calendarDays, dateKey, isInRange, orderedRange, presetRange,
  sameDay, shiftMonth, startOfMonth, todayLocal,
} from './date-utils'
import type { DateRange, PresetId } from './date-utils'

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' })

interface SavedNote { id: string; range: DateRange; text: string }
type NoteTarget = { anchor: HTMLElement; opener: HTMLButtonElement } & (
  | { mode: 'create' }
  | { mode: 'edit'; noteId: string }
)

export function DatePicker({ active }: { active: boolean }) {
  const [today, setToday] = useState(todayLocal)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(today))
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null)
  const [committedRange, setCommittedRange] = useState<DateRange | null>(null)
  const [selectionAnchor, setSelectionAnchor] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null)
  const [notes, setNotes] = useState<SavedNote[]>([])
  const dateButtons = useRef(new Map<string, HTMLButtonElement>())
  const dismissedDateClick = useRef<Element | null>(null)

  // Preserve selections across tabs, but never retain an editor or pointer preview.
  if (!active && noteTarget) setNoteTarget(null)
  if (!active && hoverDate) setHoverDate(null)

  useEffect(() => {
    const refreshToday = () => {
      const current = todayLocal()
      setToday(previous => sameDay(previous, current) ? previous : current)
    }
    const timer = window.setInterval(refreshToday, 60_000)
    window.addEventListener('focus', refreshToday)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshToday)
    }
  }, [])

  const days = calendarDays(visibleMonth)
  const displayedRange = selectionAnchor
    ? orderedRange(selectionAnchor, hoverDate ?? selectionAnchor)
    : committedRange
  const rangeCells = days.map(date => !!displayedRange && isInRange(date, displayedRange))
  const segments = rangeSegments(days, displayedRange)
  const openedNote = noteTarget?.mode === 'edit'
    ? notes.find(note => note.id === noteTarget.noteId) : undefined

  function choosePreset(id: PresetId) {
    const currentToday = todayLocal()
    const range = presetRange(id, currentToday)
    setToday(currentToday)
    setCommittedRange(range)
    setSelectedPreset(id)
    setVisibleMonth(startOfMonth(range.start))
    setSelectionAnchor(null)
    setHoverDate(null)
    setNoteTarget(null)
  }

  function chooseDate(date: Date, button: HTMLButtonElement) {
    if (dismissedDateClick.current === button) {
      dismissedDateClick.current = null
      return
    }
    // Overlapping ranges resolve to the first-created note covering this day.
    const existingNote = notes.find(note => isInRange(date, note.range))
    if (existingNote) {
      setNoteTarget({ mode: 'edit', noteId: existingNote.id, anchor: button, opener: button })
    } else if (selectionAnchor) {
      setCommittedRange(orderedRange(selectionAnchor, date))
      setSelectionAnchor(null)
      setHoverDate(null)
    } else if (committedRange && isInRange(date, committedRange)) {
      // A long range can start outside the displayed month. In that case anchor
      // to its first visible date, retaining the user's current calendar month.
      const visibleStart = days.find(day => isInRange(day, committedRange))
      const anchor = dateButtons.current.get(dateKey(committedRange.start))
        ?? (visibleStart && dateButtons.current.get(dateKey(visibleStart))) ?? button
      setNoteTarget({ mode: 'create', anchor, opener: button })
    } else {
      setSelectedPreset(null)
      setCommittedRange(null)
      setSelectionAnchor(date)
      setHoverDate(null)
      setNoteTarget(null)
    }
  }

  function changeMonth(offset: number) {
    setVisibleMonth(month => shiftMonth(month, offset))
    setHoverDate(null)
    setNoteTarget(null)
  }

  function saveNote(text: string) {
    if (!noteTarget) return
    if (noteTarget.mode === 'edit') {
      setNotes(previous => previous.map(note => note.id === noteTarget.noteId ? { ...note, text } : note))
    } else {
      if (!committedRange) return
      const note: SavedNote = { id: crypto.randomUUID(), range: committedRange, text }
      setNotes(previous => [...previous, note])
      setCommittedRange(null)
      setSelectedPreset(null)
    }
    setNoteTarget(null)
    noteTarget.opener.focus({ preventScroll: true })
  }

  function deleteNote() {
    if (noteTarget?.mode !== 'edit') return
    setNotes(previous => previous.filter(note => note.id !== noteTarget.noteId))
    setNoteTarget(null)
    noteTarget.opener.focus({ preventScroll: true })
  }

  return (
    <div className="date-picker-positioner" onPointerDownCapture={() => { dismissedDateClick.current = null }}>
      <div className="date-picker" role="group" aria-label="Date range picker">
        <div className="date-picker-presets" role="group" aria-label="Quick date ranges">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              className="date-picker-preset"
              aria-pressed={selectedPreset === preset.id}
              onClick={() => choosePreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="date-picker-calendar" onPointerLeave={() => setHoverDate(null)}>
          <div className="date-picker-calendar-header">
            <button type="button" className="date-picker-month-button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
              <img src="/assets/figma/date-picker/chevron-left.svg" width="16" height="16" alt="" />
            </button>
            <span aria-live="polite">{monthFormatter.format(visibleMonth)}</span>
            <button type="button" className="date-picker-month-button" aria-label="Next month" onClick={() => changeMonth(1)}>
              <img src="/assets/figma/date-picker/chevron-right.svg" width="16" height="16" alt="" />
            </button>
          </div>
          <div className="date-picker-grid" role="group" aria-label={monthFormatter.format(visibleMonth)}>
            <div className="date-picker-range-background" aria-hidden="true">
              {segments.map(segment => (
                <span
                  key={segment.rowIndex}
                  className="date-picker-range-segment"
                  style={{
                    gridRow: segment.rowIndex + 1,
                    gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}`,
                    borderTopLeftRadius: segment.corners.topLeft,
                    borderTopRightRadius: segment.corners.topRight,
                    borderBottomLeftRadius: segment.corners.bottomLeft,
                    borderBottomRightRadius: segment.corners.bottomRight,
                  }}
                />
              ))}
            </div>
            {days.map((date, index) => {
              const key = dateKey(date)
              const selected = rangeCells[index]
              const start = selected && sameDay(date, displayedRange!.start)
              const end = selected && sameDay(date, displayedRange!.end)
              const endpoint = start || end
              const hasNote = notes.some(note => isInRange(date, note.range))
              const isToday = sameDay(date, today)
              const outsideMonth = date.getMonth() !== visibleMonth.getMonth()
              const weekend = date.getDay() === 0 || date.getDay() === 6
              const className = [
                'date-picker-day', selected && 'is-in-range', endpoint && 'is-endpoint',
                outsideMonth && 'is-adjacent', weekend && 'is-weekend',
              ].filter(Boolean).join(' ')
              return (
                <button
                  key={key}
                  ref={element => {
                    if (element) dateButtons.current.set(key, element)
                    else dateButtons.current.delete(key)
                  }}
                  type="button"
                  className={className}
                  data-date={key}
                  data-in-range={selected || undefined}
                  aria-label={`${dateFormatter.format(date)}${hasNote ? ', has note' : ''}`}
                  aria-pressed={selected}
                  aria-current={isToday ? 'date' : undefined}
                  onPointerEnter={event => {
                    if (event.pointerType !== 'touch' && selectionAnchor) setHoverDate(date)
                  }}
                  onClick={event => chooseDate(date, event.currentTarget)}
                >
                  <span className="date-picker-day-surface" aria-hidden="true" />
                  <span className="date-picker-day-number">{date.getDate()}</span>
                  {hasNote && <img className="date-picker-note-marker" src="/assets/figma/date-picker/note-dot.svg" width="4" height="4" alt="" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      {active && noteTarget && (noteTarget.mode === 'edit' ? openedNote : committedRange) && (
        <NotePopover
          key={noteTarget.mode === 'edit' ? noteTarget.noteId : 'create'}
          mode={noteTarget.mode}
          initialText={openedNote?.text ?? ''}
          anchor={noteTarget.anchor}
          opener={noteTarget.opener}
          onDismiss={outsideTarget => {
            // Outside dismissal wins over reopening on the same pointer gesture.
            dismissedDateClick.current = outsideTarget instanceof Element
              ? outsideTarget.closest('.date-picker-day') : null
            setNoteTarget(null)
          }}
          onSave={saveNote}
          onDelete={deleteNote}
        />
      )}
    </div>
  )
}

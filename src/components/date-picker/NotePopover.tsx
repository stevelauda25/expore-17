import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface NotePopoverProps {
  mode: 'create' | 'edit'
  initialText: string
  anchor: HTMLElement
  opener: HTMLButtonElement
  onDismiss: (outsideTarget?: EventTarget | null) => void
  onSave: (text: string) => void
  onDelete: () => void
}

export function NotePopover({ mode, initialText, anchor, opener, onDismiss, onSave, onDelete }: NotePopoverProps) {
  const popup = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState(initialText)
  const isDirty = draft !== initialText
  const saveDisabled = mode === 'edit' && !isDirty

  useLayoutEffect(() => {
    function position() {
      if (!popup.current) return
      const rect = anchor.getBoundingClientRect()
      const viewport = window.visualViewport
      const leftEdge = viewport?.offsetLeft ?? 0
      const topEdge = viewport?.offsetTop ?? 0
      const width = viewport?.width ?? window.innerWidth
      const height = viewport?.height ?? window.innerHeight
      // Figma places the popup center one pixel left of the start-cell center.
      const left = Math.max(leftEdge + 8, Math.min(rect.left + rect.width / 2 - 110.5, leftEdge + width - 227))
      const top = Math.max(topEdge + 8, Math.min(rect.top - 126, topEdge + height - 126))
      popup.current.style.left = `${left}px`
      popup.current.style.top = `${top}px`
    }
    position()
    // Existing notes open for viewing; Tab still moves directly into the editor.
    if (mode === 'create') input.current?.focus({ preventScroll: true })
    else popup.current?.focus({ preventScroll: true })
    const observer = new ResizeObserver(position)
    observer.observe(anchor)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    window.visualViewport?.addEventListener('resize', position)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
      window.visualViewport?.removeEventListener('resize', position)
    }
  }, [anchor, mode])

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !popup.current?.contains(event.target)) onDismiss(event.target)
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onDismiss()
      opener.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [onDismiss, opener])

  return (
    <form
      ref={popup}
      className="date-picker-note"
      data-mode={mode}
      tabIndex={-1}
      role="dialog"
      aria-label={mode === 'edit' ? 'Edit saved note' : 'Add a note to the selected date range'}
      onSubmit={event => {
        event.preventDefault()
        if (saveDisabled) return
        const text = draft.trim()
        if (text) onSave(text)
        else input.current?.focus()
      }}
    >
      <textarea
        ref={input}
        className="date-picker-note-input"
        aria-label="Note or reminder"
        placeholder="Add note or reminder..."
        value={draft}
        onChange={event => setDraft(event.target.value)}
      />
      <div className="date-picker-note-actions">
        <button type="submit" className="date-picker-note-save" disabled={saveDisabled}>{mode === 'edit' ? 'Save' : 'Add note'}</button>
        {mode === 'edit' && <button type="button" className="date-picker-note-save date-picker-note-delete" onClick={onDelete}>Delete</button>}
      </div>
    </form>
  )
}

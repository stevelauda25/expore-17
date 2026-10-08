import { useLayoutEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import './ExplorationSwitcher.css'

export type Exploration = 'header' | 'date-picker' | 'profile' | 'document-editor'

interface ExplorationSwitcherProps {
  value: Exploration
  onChange: (value: Exploration) => void
}

const explorations: { id: Exploration; label: string }[] = [
  { id: 'header', label: 'Header' },
  { id: 'date-picker', label: 'Date picker' },
  { id: 'profile', label: 'Profile' },
  { id: 'document-editor', label: 'Document editor' },
]

export function ExplorationSwitcher({ value, onChange }: ExplorationSwitcherProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const indicator = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const pill = indicator.current
    const active = buttons.current[explorations.findIndex(item => item.id === value)]
    if (!pill || !active) return

    function measure() {
      if (!pill || !active) return
      const bounds = active.getBoundingClientRect()
      pill.style.transform = `translateX(${active.offsetLeft}px)`
      pill.style.top = `${active.offsetTop}px`
      pill.style.width = `${bounds.width}px`
      pill.style.height = `${bounds.height}px`
    }

    measure()
    if (!pill.dataset.ready) {
      // Establish the initial bounds before enabling movement between tabs.
      void pill.offsetWidth
      pill.dataset.ready = 'true'
    }

    // Font loading or resized labels can change both the width and tab offsets.
    const observer = new ResizeObserver(measure)
    buttons.current.forEach(button => { if (button) observer.observe(button) })
    return () => observer.disconnect()
  }, [value])

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % explorations.length
        break
      case 'ArrowLeft':
        nextIndex = (index - 1 + explorations.length) % explorations.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = explorations.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    onChange(explorations[nextIndex].id)
    buttons.current[nextIndex]?.focus()
  }

  return (
    <div className="exploration-switcher" role="tablist" aria-label="UI explorations">
      <span ref={indicator} className="exploration-switcher__indicator" aria-hidden="true" />
      {explorations.map(({ id, label }, index) => (
        <button
          key={id}
          ref={(element) => { buttons.current[index] = element }}
          id={`exploration-tab-${id}`}
          className={`exploration-switcher__tab exploration-switcher__tab--${id}`}
          type="button"
          role="tab"
          aria-controls={`exploration-panel-${id}`}
          aria-selected={value === id}
          tabIndex={value === id ? 0 : -1}
          onClick={() => onChange(id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

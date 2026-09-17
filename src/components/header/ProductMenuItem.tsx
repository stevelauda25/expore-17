import { BorderBeam } from 'border-beam'
import { useState, useSyncExternalStore } from 'react'
import type { SyntheticEvent } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribeToReducedMotion(onChange: () => void) {
  const preference = window.matchMedia(reducedMotionQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function getReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches
}

function getServerReducedMotion() {
  return true
}

interface ProductMenuItemProps {
  id: string
  title: string
  description: string
  onNavigate: () => void
}

export function ProductMenuItem({ id, title, description, onNavigate }: ProductMenuItemProps) {
  const [isInteracting, setIsInteracting] = useState(false)
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  )
  const isActive = isInteracting && !prefersReducedMotion

  function syncInteraction(event: SyntheticEvent<HTMLAnchorElement>) {
    // Match the existing CSS state, including keyboard-only focus emphasis.
    setIsInteracting(event.currentTarget.matches(':hover, :focus-visible'))
  }

  // Keep the original exports; AI Agent's original asset is its colorful state.
  const neutralIcon = `/assets/figma/${id}${id === 'ai-agent' ? '-neutral' : ''}.svg`
  const activeIcon = `/assets/figma/${id}${id === 'ai-agent' ? '' : '-active'}.svg`

  return (
    <a
      className="product-item"
      href={`#${id}`}
      onPointerEnter={syncInteraction}
      onPointerLeave={syncInteraction}
      onPointerDown={syncInteraction}
      onFocus={syncInteraction}
      onBlur={syncInteraction}
      onKeyDown={syncInteraction}
      onKeyUp={syncInteraction}
      onClick={(event) => {
        // Destinations will be supplied when the exploration joins a real site.
        event.preventDefault()
        onNavigate()
      }}
    >
      <BorderBeam
        className="product-icon-beam"
        size="sm"
        colorVariant="colorful"
        strength={0.6}
        duration={1.96}
        active={isActive}
        theme="dark"
        borderRadius={8}
        aria-hidden="true"
      >
        <span className="product-icon" aria-hidden="true">
          <img className="product-icon__neutral" src={neutralIcon} alt="" width="24" height="24" />
          <img className="product-icon__active" src={activeIcon} alt="" width="24" height="24" />
        </span>
      </BorderBeam>
      <span className="product-copy">
        <span className="product-title">{title}</span>
        <span className="product-description">{description}</span>
      </span>
    </a>
  )
}

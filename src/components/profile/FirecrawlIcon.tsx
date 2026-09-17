import { useId, useLayoutEffect, useRef } from 'react'
import motion from './assets/firecrawl-motion.json'

/** Official brand symbol at rest; Firecrawl's original SVG morph on interaction. */
export function FirecrawlIcon({ active }: { active: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const initialized = useRef(false)
  const maskId = useId()

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let settleTimer: ReturnType<typeof setTimeout> | undefined

    function rest() {
      svg!.pauseAnimations()
      svg!.setCurrentTime(0)
    }

    function syncMotion() {
      clearTimeout(settleTimer)
      if (reducedMotion.matches) rest()
      else if (active) svg!.unpauseAnimations()
      // Let the official morph fade out before resetting its timeline.
      else if (!svg!.animationsPaused()) settleTimer = setTimeout(rest, 140)
    }

    // Pause before the first paint: no idle animation, including hidden menus.
    if (!initialized.current) {
      rest()
      initialized.current = true
    }
    syncMotion()
    reducedMotion.addEventListener('change', syncMotion)
    return () => {
      clearTimeout(settleTimer)
      reducedMotion.removeEventListener('change', syncMotion)
    }
  }, [active])

  return (
    <span className="profile-icon profile-firecrawl" data-active={active} aria-hidden="true">
      <img
        className="profile-firecrawl__static"
        src="/assets/profile/firecrawl-flame.svg"
        width={14}
        height={14}
        alt=""
        draggable={false}
      />
      <svg
        ref={svgRef}
        className="profile-firecrawl__animated"
        width={14}
        height={14}
        viewBox={motion.viewBox}
        fill="none"
        focusable="false"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600">
            <rect width="600" height="600" fill="white" />
            <path d={motion.innerD} transform={motion.innerGroupTransform} fill="black" />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <path d={motion.outerDefaultD} transform={motion.outerGroupTransform} fill="#FA5D19">
            <animate
              attributeName="d"
              dur={motion.duration}
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes={motion.keyTimes.join(';')}
              keySplines={motion.keySplines.join(';')}
              values={motion.values.join(';')}
            />
          </path>
        </g>
      </svg>
    </span>
  )
}

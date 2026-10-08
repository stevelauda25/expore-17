export type IconName =
  | 'nav-faults' | 'nav-sites' | 'nav-plans' | 'nav-logs'
  | 'breadcrumb-chevron' | 'inspect-arrow' | 'notifications'
  | 'metric-energy' | 'metric-anomaly' | 'metric-clock'
  | 'finding-sparkles' | 'control-log' | 'expand'
  | 'coverage' | 'review-context' | 'weather' | 'unverified'

// Original Figma exports retain their intrinsic 12 × 12 SVG geometry.
export function Icon({ name }: { name: IconName }) {
  return <img className="icon" src={`/facility-app/assets/figma/${name}.svg`} alt="" aria-hidden="true" />
}

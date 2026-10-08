import App from './App'
import './styles/tokens.css'
import './styles/app.css'
import './styles/components.css'
import './host.css'

// Phase 1 has no global listeners or floating surfaces. Keep the activity
// boundary explicit for future Phase 2 controllers and scoped portal roots.
export default function FacilityAppDemo({ active }: { active: boolean }) {
  return <div className="facility-app-scope" data-facility-active={active}><App /></div>
}

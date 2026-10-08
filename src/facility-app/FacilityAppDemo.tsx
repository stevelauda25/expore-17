import App from './App'
import './styles/tokens.css'
import './styles/app.css'
import './styles/components.css'
import './host.css'
import './styles/interactions.css'

// Floating UI stays inside this scope; inactive explorations dismiss transient UI.
export default function FacilityAppDemo({ active }: { active: boolean }) {
  return <div className="facility-app-scope" data-facility-active={active}><App active={active} /></div>
}

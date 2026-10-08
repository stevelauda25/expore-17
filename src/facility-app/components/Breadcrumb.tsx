import { Icon } from './Icon'
export function Breadcrumb({ onNavigate }: { onNavigate: (label: string) => void }) {
  return <nav className="breadcrumb-bar" data-geometry="breadcrumb" aria-label="Breadcrumb"><ol>
    <li><button type="button" onClick={() => onNavigate('Afterhours')}>Afterhours</button></li>
    <li aria-hidden="true"><Icon name="breadcrumb-chevron" /></li>
    <li><button type="button" onClick={() => onNavigate('Cedar Campus')}>Cedar Campus</button></li>
    <li aria-hidden="true"><Icon name="breadcrumb-chevron" /></li>
    <li aria-current="page">Facilities</li>
  </ol></nav>
}

import { Icon } from './Icon'

export function Breadcrumb() {
  return (
    <nav className="breadcrumb-bar" data-geometry="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><button type="button" aria-disabled="true">Afterhours</button></li>
        <li aria-hidden="true"><Icon name="breadcrumb-chevron" /></li>
        <li><button type="button" aria-disabled="true">Cedar Campus</button></li>
        <li aria-hidden="true"><Icon name="breadcrumb-chevron" /></li>
        <li aria-current="page">Facilities</li>
      </ol>
    </nav>
  )
}

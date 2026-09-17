import { ProductMenuItem } from './ProductMenuItem'
import { UtilityLink } from './UtilityLink'

const resourceColumns = [
  [
    { id: 'guides', title: 'Guides', description: 'Practical tips to get more done' },
    { id: 'customer-stories', title: 'Customer Stories', description: 'See how teams use our platform' },
  ],
  [
    { id: 'blog', title: 'Blog', description: 'Ideas, insights, and product news' },
    { id: 'templates', title: 'Templates', description: 'Ready-to-use workflows for your team' },
  ],
]

const utilityLinks = [
  { id: 'help-center', label: 'Help Center' },
  { id: 'community', label: 'Community' },
  { id: 'events-webinars', label: 'Events & Webinars' },
]

interface ResourcesDropdownProps {
  onNavigate: () => void
}

export function ResourcesDropdown({ onNavigate }: ResourcesDropdownProps) {
  return (
    <div className="dropdown-content">
      {/* Figma 2849:2514 shares Products' centered 760×208 panel and grid. */}
      <div className="products-grid">
        {resourceColumns.map((column) => (
          <div className="products-column" key={column[0].id}>
            {column.map((resource) => <ProductMenuItem key={resource.id} {...resource} onNavigate={onNavigate} />)}
          </div>
        ))}
      </div>
      <div className="products-utilities">
        {utilityLinks.map((link) => <UtilityLink key={link.id} {...link} onNavigate={onNavigate} />)}
      </div>
    </div>
  )
}

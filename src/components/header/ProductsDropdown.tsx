import { ProductMenuItem } from './ProductMenuItem'
import { UtilityLink } from './UtilityLink'

const productColumns = [
  [
    { id: 'ai-agent', title: 'AI Agent', description: 'Resolve conversations automatically' },
    { id: 'knowledge-base', title: 'Knowledge Base', description: 'Turn docs into answers' },
  ],
  [
    { id: 'workflow-builder', title: 'Workflow Builder', description: 'Automate support workflows' },
    { id: 'analytics', title: 'Analytics', description: 'Track support performance' },
  ],
]

const utilityLinks = [
  { id: 'api-documentation', label: 'API Documentation' },
  { id: 'help-center', label: 'Help Center' },
  { id: 'product-updates', label: 'Product Updates' },
]

interface ProductsDropdownProps {
  onNavigate: () => void
}

export function ProductsDropdown({ onNavigate }: ProductsDropdownProps) {
  return (
    <div className="dropdown-content">
      <div className="products-grid">
        {productColumns.map((column) => (
          <div className="products-column" key={column[0].id}>
            {column.map((product) => <ProductMenuItem key={product.id} {...product} onNavigate={onNavigate} />)}
          </div>
        ))}
      </div>
      <div className="products-utilities">
        {utilityLinks.map((link) => <UtilityLink key={link.id} {...link} onNavigate={onNavigate} />)}
      </div>
    </div>
  )
}

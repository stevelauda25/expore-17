import type { ReactNode, ComponentProps, RefObject } from 'react'
import type { Equipment } from '../data/equipment'
import { Sidebar } from './Sidebar'
import { Breadcrumb } from './Breadcrumb'
import { BottomActionBar } from './BottomActionBar'

export function AppShell({ selected, children, sidebar, onBreadcrumb, onInspect, inspectTrigger }: { selected: Equipment; children: ReactNode; sidebar: ComponentProps<typeof Sidebar>; onBreadcrumb: (label: string) => void; onInspect: () => void; inspectTrigger: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className="app-shell">
      <Sidebar {...sidebar} />
      <Breadcrumb onNavigate={onBreadcrumb} />
      <main className="main-content">{children}</main>
      <BottomActionBar selected={selected} onInspect={onInspect} trigger={inspectTrigger} />
    </div>
  )
}

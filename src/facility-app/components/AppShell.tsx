import type { ReactNode } from 'react'
import type { Equipment } from '../data/equipment'
import { Sidebar } from './Sidebar'
import { Breadcrumb } from './Breadcrumb'
import { BottomActionBar } from './BottomActionBar'

export function AppShell({ selected, children }: { selected: Equipment; children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <Breadcrumb />
      <main className="main-content">{children}</main>
      <BottomActionBar selected={selected} />
    </div>
  )
}

import { useState } from 'react'
import { DatePickerDemo } from './components/date-picker/DatePickerDemo'
import { ProfileDemo } from './components/profile/ProfileDemo'
import { ExplorationSwitcher } from './components/ExplorationSwitcher'
import type { Exploration } from './components/ExplorationSwitcher'
import { HeaderDemo } from './components/header/HeaderDemo'

export default function App() {
  const [exploration, setExploration] = useState<Exploration>('header')

  return (
    <main className={`exploration-page exploration-page--${exploration}`}>
      <section
        id="exploration-panel-header"
        className="exploration-panel"
        role="tabpanel"
        aria-labelledby="exploration-tab-header"
        hidden={exploration !== 'header'}
        tabIndex={0}
      >
        {exploration === 'header' && <HeaderDemo />}
      </section>
      <DatePickerDemo active={exploration === 'date-picker'} />
      <ProfileDemo active={exploration === 'profile'} />
      <ExplorationSwitcher value={exploration} onChange={setExploration} />
    </main>
  )
}

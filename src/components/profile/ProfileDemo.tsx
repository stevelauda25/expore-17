import { useState, useSyncExternalStore } from 'react'
import { ProfileMenu } from './ProfileMenu'
import type { ProfileTheme } from './ProfileMenu'
import './profile.css'

interface ProfileDemoProps {
  active: boolean
}

const themeStorageKey = 'profile-demo-theme'
const systemThemeQuery = '(prefers-color-scheme: dark)'

function readThemePreference(): ProfileTheme {
  try {
    const stored = window.localStorage.getItem(themeStorageKey)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // The demo still works when browser storage is unavailable.
  }
  return 'system'
}

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(systemThemeQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function readSystemTheme() {
  return window.matchMedia(systemThemeQuery).matches ? 'dark' : 'light'
}

export function ProfileDemo({ active }: ProfileDemoProps) {
  const [selectedTheme, setSelectedTheme] = useState<ProfileTheme>(readThemePreference)
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, readSystemTheme, () => 'light')
  const resolvedTheme = selectedTheme === 'system' ? systemTheme : selectedTheme

  function selectTheme(theme: ProfileTheme) {
    setSelectedTheme(theme)
    try {
      window.localStorage.setItem(themeStorageKey, theme)
    } catch {
      // Keep the in-memory preference usable even if persistence is blocked.
    }
  }

  return (
    <section
      id="exploration-panel-profile"
      className="exploration-panel profile-demo"
      data-theme={selectedTheme}
      data-resolved-theme={resolvedTheme}
      role="tabpanel"
      aria-labelledby="exploration-tab-profile"
      hidden={!active}
      tabIndex={0}
    >
      {active && (
        <ProfileMenu selectedTheme={selectedTheme} onSelectTheme={selectTheme} />
      )}
    </section>
  )
}

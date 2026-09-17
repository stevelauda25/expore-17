import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FirecrawlIcon } from './FirecrawlIcon'

export type ProfileTheme = 'light' | 'dark' | 'system'

interface ProfileMenuProps {
  selectedTheme: ProfileTheme
  onSelectTheme: (theme: ProfileTheme) => void
}

const themes: { value: ProfileTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function ProfileIcon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`profile-icon profile-icon--monochrome ${className}`}
      style={{ maskImage: `url(/assets/figma/profile/${name}.svg)` }}
      aria-hidden="true"
    />
  )
}

export function ProfileMenu({ selectedTheme, onSelectTheme }: ProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [betaHovered, setBetaHovered] = useState(false)
  const [betaFocused, setBetaFocused] = useState(false)
  const controlsRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const settingsRef = useRef<HTMLButtonElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)
  const themeOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const themeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingFocus = useRef<'settings' | 'theme' | null>(null)

  const cancelThemeClose = useCallback(() => {
    if (themeCloseTimer.current !== null) {
      clearTimeout(themeCloseTimer.current)
      themeCloseTimer.current = null
    }
  }, [])

  const cancelThemeOpen = useCallback(() => {
    if (themeOpenTimer.current !== null) {
      clearTimeout(themeOpenTimer.current)
      themeOpenTimer.current = null
    }
  }, [])

  const close = useCallback(() => {
    cancelThemeClose()
    cancelThemeOpen()
    pendingFocus.current = null
    setThemeOpen(false)
    setBetaHovered(false)
    setBetaFocused(false)
    setOpen(false)
  }, [cancelThemeClose, cancelThemeOpen])

  useEffect(() => () => {
    cancelThemeClose()
    cancelThemeOpen()
  }, [cancelThemeClose, cancelThemeOpen])

  useEffect(() => {
    if (!open) return

    function handleOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !controlsRef.current?.contains(event.target)) {
        close()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      close()
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handleOutsidePointer, true)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer, true)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, close])

  useLayoutEffect(() => {
    if (open && pendingFocus.current === 'settings') {
      settingsRef.current?.focus()
      pendingFocus.current = null
    } else if (open && themeOpen && pendingFocus.current === 'theme') {
      themeRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
      pendingFocus.current = null
    }
  }, [open, themeOpen])

  function scheduleThemeClose() {
    cancelThemeOpen()
    cancelThemeClose()
    themeCloseTimer.current = setTimeout(() => {
      themeCloseTimer.current = null
      // Keep a keyboard user's focused choice visible when the pointer leaves.
      if (!themeRef.current?.contains(document.activeElement)) {
        setThemeOpen(false)
      }
    }, 150)
  }

  return (
    <div
      ref={controlsRef}
      className="profile-controls"
    >
      <button
        ref={triggerRef}
        id="profile-trigger"
        className="profile-trigger"
        type="button"
        aria-expanded={open}
        aria-controls="profile-options"
        onClick={() => {
          if (open) close()
          else setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown') return
          event.preventDefault()
          if (open) settingsRef.current?.focus()
          else {
            pendingFocus.current = 'settings'
            setOpen(true)
          }
        }}
      >
        <span>Islam Makhachev</span>
        <ProfileIcon name="account-chevron" className="profile-trigger__chevron" />
      </button>

      <div
        id="profile-options"
        className="profile-menu profile-surface"
        role="group"
        aria-label="Profile actions"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="profile-menu__section profile-menu__section--divided">
          <div className="profile-email">makhachevufc@gmail.com</div>
          <button ref={settingsRef} className="profile-row" type="button">
            <ProfileIcon name="settings" />
            <span>Settings</span>
          </button>
          <div
            className="profile-theme-region"
            onPointerEnter={(event) => {
              if (event.pointerType === 'touch') return
              cancelThemeClose()
              cancelThemeOpen()
              if (!themeOpen) {
                themeOpenTimer.current = setTimeout(() => {
                  themeOpenTimer.current = null
                  setThemeOpen(true)
                }, 250)
              }
            }}
            onPointerLeave={scheduleThemeClose}
          >
            <button
              id="profile-theme-trigger"
              className="profile-row profile-theme-trigger"
              type="button"
              aria-expanded={themeOpen}
              aria-controls="profile-theme-options"
              onClick={() => {
                cancelThemeClose()
                cancelThemeOpen()
                setThemeOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowRight') return
                event.preventDefault()
                cancelThemeClose()
                cancelThemeOpen()
                if (themeOpen) {
                  themeRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
                } else {
                  pendingFocus.current = 'theme'
                  setThemeOpen(true)
                }
              }}
            >
              <ProfileIcon name="theme" />
              <span>Theme</span>
              <ProfileIcon name="chevron-right" />
            </button>

            <div
              ref={themeRef}
              id="profile-theme-options"
              className="profile-theme-options profile-surface"
              data-open={open && themeOpen}
              aria-hidden={!open || !themeOpen}
              inert={!open || !themeOpen}
              onPointerEnter={cancelThemeClose}
            >
              <div id="profile-theme-heading" className="profile-theme-heading">Theme</div>
              <div role="radiogroup" aria-labelledby="profile-theme-heading">
                {themes.map(({ value, label }) => (
                  <label
                    key={value}
                    className="profile-row profile-theme-option"
                    data-selected={selectedTheme === value}
                  >
                    <input
                      type="radio"
                      name="profile-theme"
                      value={value}
                      checked={selectedTheme === value}
                      onChange={() => onSelectTheme(value)}
                    />
                    <ProfileIcon name={value} className="profile-theme-option__icon" />
                    <span>{label}</span>
                    {selectedTheme === value && <ProfileIcon name="check" />}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="profile-menu__section profile-menu__section--divided">
          <button className="profile-row" type="button">
            <ProfileIcon name="feedback" />
            <span>Share feedback</span>
          </button>
          <button
            className="profile-row profile-row--beta"
            type="button"
            onPointerEnter={(event) => {
              if (event.pointerType !== 'touch') setBetaHovered(true)
            }}
            onPointerLeave={() => setBetaHovered(false)}
            onFocus={(event) => setBetaFocused(event.currentTarget.matches(':focus-visible'))}
            onBlur={() => setBetaFocused(false)}
          >
            <FirecrawlIcon active={open && (betaHovered || betaFocused)} />
            <span>Switch to Beta</span>
          </button>
        </div>
        <div className="profile-menu__section">
          <button className="profile-row profile-row--logout" type="button">
            <ProfileIcon name="logout" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

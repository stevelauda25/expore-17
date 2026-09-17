import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { SharedMenuShell } from './SharedMenuShell'
import type { MenuId } from './SharedMenuShell'

const menus = [
  { id: 'products', label: 'Products' },
  { id: 'resources', label: 'Resources' },
] as const

export function HeaderNav() {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null)
  const activeMenu = useRef<MenuId | null>(null)
  const triggers = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({})
  const shell = useRef<HTMLDivElement>(null)
  const customerLink = useRef<HTMLAnchorElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusFrame = useRef<number | null>(null)

  function getPanel(menu: MenuId) {
    return shell.current?.querySelector<HTMLDivElement>(`#${menu}-dropdown`)
  }

  function getLinks(menu: MenuId) {
    return Array.from(getPanel(menu)?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [])
      .filter((link) => !link.closest('[inert]'))
  }

  function cancelClose() {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function cancelPendingFocus() {
    if (focusFrame.current !== null) {
      cancelAnimationFrame(focusFrame.current)
      focusFrame.current = null
    }
  }

  function closeMenu(menu: MenuId) {
    if (activeMenu.current !== menu) return
    cancelClose()
    cancelPendingFocus()
    activeMenu.current = null
    setOpenMenu(null)
  }

  function showMenu(menu: MenuId) {
    cancelClose()
    if (activeMenu.current === menu) return
    cancelPendingFocus()
    const previousMenu = activeMenu.current
    const focusWasInside = previousMenu && getPanel(previousMenu)?.contains(document.activeElement)
    // Commit the logical destination before moving focus: the outgoing blur
    // must not close the shared shell during a menu-to-menu transition.
    activeMenu.current = menu
    setOpenMenu(menu)
    if (focusWasInside) triggers.current[menu]?.focus()
  }

  function scheduleClose(menu: MenuId) {
    if (activeMenu.current !== menu) return
    cancelClose()
    // Keyboard users retain their place even if the pointer leaves the menu.
    if (getPanel(menu)?.contains(document.activeElement)) return
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null
      if (!getPanel(menu)?.contains(document.activeElement)) closeMenu(menu)
    }, 150)
  }

  function focusFirstLink(menu: MenuId) {
    showMenu(menu)
    cancelPendingFocus()
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null
      if (activeMenu.current === menu) getLinks(menu)[0]?.focus()
    })
  }

  function handleNavBlur(event: FocusEvent<HTMLElement>) {
    const menu = activeMenu.current
    if (!menu) return
    const panel = getPanel(menu)
    // Ignore a late blur from content that has already become outgoing.
    const isTrigger = Object.values(triggers.current).some((control) => control === event.target)
    if (!isTrigger && !panel?.contains(event.target)) return
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && (panel?.contains(nextTarget)
      || Object.values(triggers.current).some((control) => control === nextTarget))) return
    closeMenu(menu)
  }

  function handleNavKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    const triggerMenu = menus.find(({ id }) => triggers.current[id] === event.target)?.id
    if (event.key === 'ArrowDown' && triggerMenu) {
      event.preventDefault()
      focusFirstLink(triggerMenu)
      return
    }
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return
    const menu = activeMenu.current
    if (!menu) return
    const links = getLinks(menu)
    if (links.length === 0) return

    // The shared panel lives after the navigation in the DOM. Preserve the
    // disclosure's logical tab sequence without trapping focus inside it.
    if (!event.shiftKey && event.target === triggers.current[menu]) {
      event.preventDefault()
      links[0].focus()
    } else if (event.shiftKey && event.target === links[0]) {
      event.preventDefault()
      triggers.current[menu]?.focus()
    } else if (!event.shiftKey && event.target === links[links.length - 1]) {
      const nextControl = menu === 'products' ? triggers.current.resources : customerLink.current
      if (nextControl) {
        event.preventDefault()
        closeMenu(menu)
        nextControl.focus()
      }
    }
  }

  useEffect(() => {
    function dismiss() {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current)
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current)
      closeTimer.current = null
      focusFrame.current = null
      activeMenu.current = null
      setOpenMenu(null)
    }

    function handlePointerDown(event: PointerEvent) {
      if (!activeMenu.current) return
      const target = event.target
      if (target instanceof Node && !shell.current?.contains(target)
        && !Object.values(triggers.current).some((trigger) => trigger?.contains(target))) {
        dismiss()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      const menu = activeMenu.current
      if (event.key !== 'Escape' || !menu) return
      const focusIsInside = shell.current?.querySelector(`#${menu}-dropdown`)?.contains(document.activeElement)
      dismiss()
      if (focusIsInside) triggers.current[menu]?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      if (closeTimer.current !== null) clearTimeout(closeTimer.current)
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current)
    }
  }, [])

  return (
    <header className="header-bar">
      <nav
        className="header-nav"
        aria-label="Main navigation"
        data-open-menu={openMenu ?? undefined}
        onBlur={handleNavBlur}
        onFocus={(event) => {
          const menu = activeMenu.current
          if (menu && (event.target === triggers.current[menu] || getPanel(menu)?.contains(event.target))) cancelClose()
        }}
        onKeyDown={handleNavKeyDown}
      >
        <div className="header-brand">
          <a className="header-logo" href="#" aria-label="Layers home" onClick={(event) => event.preventDefault()}>
            <img src="/assets/figma/logo.svg" width="31.167" height="31.167" alt="" />
          </a>
        </div>

        <div className="header-links">
          {menus.map(({ id, label }) => (
            <div key={id} className={`${id}-disclosure`}>
              <button
                ref={(node) => { triggers.current[id] = node }}
                type="button"
                id={`${id}-trigger`}
                className={`nav-link ${id === 'products' ? 'products-trigger' : 'nav-link--resources resources-trigger'}`}
                aria-expanded={openMenu === id}
                aria-haspopup="dialog"
                aria-controls={`${id}-dropdown`}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') showMenu(id)
                }}
                onPointerLeave={() => scheduleClose(id)}
                onClick={() => {
                  if (activeMenu.current === id) {
                    if (getPanel(id)?.contains(document.activeElement)) triggers.current[id]?.focus()
                    closeMenu(id)
                  } else {
                    showMenu(id)
                  }
                }}
              >
                {label}
              </button>
            </div>
          ))}
          {['Customer', 'Pricing'].map((label) => (
            <a
              key={label}
              ref={label === 'Customer' ? customerLink : undefined}
              className={`nav-link nav-link--${label.toLowerCase()}`}
              href={`#${label.toLowerCase()}`}
              onClick={(event) => event.preventDefault()}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="header-auth">
          <button type="button" className="nav-link login-button">Log in</button>
          <button type="button" className="nav-link signup-button">Sign up</button>
        </div>

        <SharedMenuShell
          ref={shell}
          activeMenu={openMenu}
          onPointerEnter={cancelClose}
          onPointerLeave={() => {
            if (activeMenu.current) scheduleClose(activeMenu.current)
          }}
          onNavigate={(menu) => {
            if (activeMenu.current !== menu) return
            triggers.current[menu]?.focus()
            closeMenu(menu)
          }}
        />
      </nav>
    </header>
  )
}

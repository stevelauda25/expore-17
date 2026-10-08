import { useRef, useState, useCallback, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react'
import { autoUpdate, flip, FloatingFocusManager, FloatingPortal, offset, shift, useClick, useDismiss, useFloating, useInteractions, useMergeRefs, useRole, useTransitionStyles, type Placement } from '@floating-ui/react'

export type PopoverName = 'workspace' | 'notifications' | 'account' | 'control-log' | null
export type PopoverState = { openPopover: PopoverName; setOpenPopover: (name: PopoverName) => void }
type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & { ref: Ref<HTMLButtonElement> }

export function Popover({ name, state, label, menu = false, placement = 'bottom-start', trigger, children }: {
  name: Exclude<PopoverName, null>; state: PopoverState; label: string; menu?: boolean; placement?: Placement
  trigger: (props: TriggerProps) => ReactNode; children: (close: () => void) => ReactNode
}) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const resolveRoot = useCallback((node: HTMLButtonElement | null) => { if (node) setPortalRoot(node.closest<HTMLElement>('.facility-app-scope')) }, [])
  const triggerElement = useRef<HTMLButtonElement>(null)
  const open = state.openPopover === name
  const close = () => state.setOpenPopover(null)
  const { refs: { setReference, setFloating }, floatingStyles, context } = useFloating({
    open, onOpenChange: (next, event, reason) => {
      state.setOpenPopover(next ? name : null)
      // Restore after an outside click on non-focusable content, without stealing
      // focus from another control or an exploration switch.
      if (!next && reason === 'outside-press' && event?.target instanceof Element && !event.target.closest('button, a, input, select, textarea, [tabindex]:not([role="tabpanel"])')) {
        requestAnimationFrame(() => { if (triggerElement.current?.closest('[data-facility-active="true"]')) triggerElement.current.focus() })
      }
    }, placement, strategy: 'fixed',
    whileElementsMounted: autoUpdate, middleware: [offset(8), flip(), shift({ padding: 10 })],
  })
  const referenceRef = useMergeRefs([setReference, triggerElement, resolveRoot])
  const { getReferenceProps, getFloatingProps } = useInteractions([useClick(context), useDismiss(context), useRole(context, { role: menu ? 'menu' : 'dialog' })])
  const { isMounted, styles } = useTransitionStyles(context, { duration: { open: 160, close: 140 }, initial: { opacity: 0, transform: 'translateY(3px)' } })
  return <>
    {trigger({ ...getReferenceProps(), ref: referenceRef })}
    {isMounted && portalRoot && <FloatingPortal root={portalRoot}><FloatingFocusManager context={context} modal={false} returnFocus closeOnFocusOut>
      <div ref={setFloating} style={floatingStyles} {...getFloatingProps({
        'aria-label': label, className: 'facility-floating-position',
        onKeyDown(event) {
          if (!menu || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
          const index = items.indexOf(document.activeElement as HTMLButtonElement)
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
          items[next]?.focus()
        },
      })}>
        <div className="facility-popover facility-motion" style={styles}>{children(close)}</div>
      </div>
    </FloatingFocusManager></FloatingPortal>}
  </>
}

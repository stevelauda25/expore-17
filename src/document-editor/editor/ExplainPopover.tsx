import { useLayoutEffect, useRef, useState } from 'react'
import { FloatingFocusManager, FloatingPortal, autoUpdate, shift, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react'
import { ExplainMenuContent } from '../components/ExplainMenuContent'
import type { ExplainController } from './useExplain'
import menuStyles from '../components/ExplainMenu.module.css'
import styles from './Explain.module.css'
import { editorFloatingPadding, useEditorEnvironment } from '../EditorEnvironment'

function QuestionForm({ run, question, setQuestion }: { run: ExplainController['run']; question: string; setQuestion: (value: string) => void }) {
  return <form onSubmit={event => { event.preventDefault(); if (question.trim()) run('Ask a question', question.trim()) }}>
    <label htmlFor="explain-question">Ask anything about this text</label>
    <textarea id="explain-question" value={question} onChange={event => setQuestion(event.target.value)} rows={4} />
    <button className={styles.primary} disabled={!question.trim()} type="submit">Ask question</button>
  </form>
}

export function ExplainPopover({ controller, visible = true }: { controller: ExplainController; visible?: boolean }) {
  const { portalRoot } = useEditorEnvironment()
  const [question, setQuestion] = useState('')
  const { state, close, run, back, cancelResponse, apply } = controller
  const open = visible && state.view !== 'closed'
  const body = useRef<HTMLDivElement>(null)
  const { refs, floatingStyles, context } = useFloating({
    open, onOpenChange: (next, event, reason) => { if (!next) close(reason === 'escape-key' || event?.type === 'keydown') },
    strategy: 'fixed', placement: 'bottom-start',
    middleware: [shift(() => ({ padding: editorFloatingPadding(), mainAxis: true, crossAxis: true }))],
    whileElementsMounted: (reference, floating, update) => autoUpdate(reference, floating, update, { animationFrame: true }),
  })
  const { setPositionReference } = refs
  useLayoutEffect(() => {
    if (!open) return
    const shell = document.querySelector('[data-testid="app-shell"]')!
    setPositionReference({ contextElement: shell, getBoundingClientRect: () => {
      const rect = shell.getBoundingClientRect()
      return new DOMRect(rect.right - 341, rect.top + 140, 0, 0)
    } })
  }, [open, setPositionReference])
  const dismiss = useDismiss(context, { outsidePress: event => !(event.target as Element)?.closest('[data-explain-trigger], [data-clause-marker], [data-clause-text], [data-document-tab], [aria-label="UI explorations"]') })
  const role = useRole(context, { role: 'dialog' })
  const { getFloatingProps } = useInteractions([dismiss, role])
  useLayoutEffect(() => {
    if (!body.current) return
    body.current.scrollTop = 0
    const target = body.current.querySelector<HTMLElement>(state.view === 'question' ? 'textarea' : state.view === 'menu' ? 'button' : '[data-state-heading]')
    // Returning with the playground keyboard switcher must leave its roving focus intact.
    if (!document.activeElement?.closest('[aria-label="UI explorations"]')) target?.focus({ preventScroll: true })
  }, [state.view, open])
  return open && <FloatingPortal root={portalRoot}><FloatingFocusManager context={context} modal={false} initialFocus={document.activeElement?.closest('[aria-label="UI explorations"]') ? -1 : 0} returnFocus={false} restoreFocus>
    <div ref={node => { refs.setFloating(node); body.current = node }} style={floatingStyles} className={`${menuStyles.popover} ${styles.popover}`} data-testid="explain-menu" aria-label="Explain this" tabIndex={-1}
      {...getFloatingProps({ onKeyDown(event) {
        if (event.key === 'Tab') {
          const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), textarea'))
          if (event.target === stops[event.shiftKey ? 0 : stops.length - 1]) {
            event.preventDefault(); close(); return
          }
        }
        if (!(event.target instanceof HTMLButtonElement) || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
        const index = buttons.indexOf(event.target)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length
        event.preventDefault(); buttons[next]?.focus()
      } })}>
      {state.view === 'menu' ? <ExplainMenuContent onAction={run} /> : <div className={styles.response}>
        <button className={styles.back} onClick={back}>Back</button>
        <h2 data-state-heading tabIndex={-1}>{state.action}</h2>
        {state.view === 'question' ? <QuestionForm run={run} question={question} setQuestion={setQuestion} /> : <>
          {state.question && <p className={styles.question}>{state.question}</p>}
          {state.view === 'loading' && <><p role="status">Generating response…</p><button className={styles.secondary} onClick={cancelResponse}>Cancel</button></>}
          {state.view === 'error' && <><p role="alert">The prototype response could not be generated. Please try again.</p><button className={styles.primary} onClick={() => run(state.action!, state.question)}>Retry</button></>}
          {state.view === 'cancelled' && !state.stale && <><p role="status">Response cancelled.</p><button className={styles.primary} onClick={() => run(state.action!, state.question)}>Retry</button></>}
          {state.view === 'result' && <><p className={styles.label}>Prototype response</p><div className={styles.result} data-testid="explain-result" role="status">
            {state.result?.points ? <ul>{state.result.points.map((point, index) => <li key={index}>{point}</li>)}</ul> : <p>{state.result?.text}</p>}
          </div>{state.action === 'Rewrite' && <button className={styles.primary} disabled={state.stale} onClick={apply}>Apply</button>}</>}
        </>}
        {state.stale && <div className={styles.stale} role="alert"><p>The selected text changed. Regenerate before applying a response. If the passage was deleted, select new text.</p><button className={styles.secondary} onClick={() => run(state.action!, state.question)}>Regenerate</button></div>}
      </div>}
    </div>
  </FloatingFocusManager></FloatingPortal>
}

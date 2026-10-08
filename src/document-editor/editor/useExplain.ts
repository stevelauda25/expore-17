import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { applyExplainRewrite, explainKey, pinExplainSource, refreshExplainSource } from './explainPlugin'
import { getSelectionContext, restoreSelection, type SelectionContext } from './plugins'
import { requestExplanation, type ExplainAction, type ExplainResult } from './explainService'

interface State {
  view: 'closed' | 'menu' | 'question' | 'loading' | 'result' | 'error' | 'cancelled'
  action?: ExplainAction
  question?: string
  source?: SelectionContext
  result?: ExplainResult
  stale?: boolean
}
export function useExplain(editor: Editor | null, active = true) {
  const [state, setState] = useState<State>({ view: 'closed' })
  const request = useRef<AbortController | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    // Abort the external service on deactivation; its rejection records cancellation.
    if (!active) request.current?.abort()
  }, [active])
  const changingSelection = useRef(false)
  const cancel = useCallback(() => { request.current?.abort(); request.current = null }, [])
  const close = useCallback((returnFocus = true) => {
    cancel()
    setState({ view: 'closed' })
    if (!editor || editor.isDestroyed) return
    editor.view.dispatch(editor.state.tr.setMeta(explainKey, { source: null }))
    if (returnFocus) {
      restoreSelection(editor)
      if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true })
    }
  }, [editor, cancel])
  const open = useCallback((element: HTMLElement, range?: { from: number; to: number }) => {
    if (!editor) return
    if (!range && !getSelectionContext(editor)) return
    cancel()
    changingSelection.current = true
    if (range) editor.commands.setTextSelection(range)
    restoreSelection(editor)
    const source = pinExplainSource(editor)
    changingSelection.current = false
    if (!source) return
    trigger.current = element
    setState({ view: 'menu', source })
  }, [editor, cancel])
  useEffect(() => {
    if (!editor) return
    // Subscribe to authoritative transactions, without copying editor state into React.
    const changed = ({ transaction: tr }: { transaction: import('@tiptap/pm/state').Transaction }) => {
      if (changingSelection.current) return
      const source = explainKey.getState(editor.state)?.source
      if (!source) return
      if (tr.selectionSet && !tr.docChanged && !editor.state.selection.eq(source.bookmark.resolve(editor.state.doc))) { close(false); return }
      if (source.stale) {
        cancel()
        setState(old => old.stale ? old : { ...old, view: old.view === 'loading' ? 'cancelled' : old.view, stale: true })
      }
    }
    editor.on('transaction', changed)
    return () => { editor.off('transaction', changed); cancel() }
  }, [editor, cancel, close])
  const run = useCallback((action: ExplainAction, question?: string) => {
    if (!editor) return
    cancel()
    changingSelection.current = true
    const source = refreshExplainSource(editor)
    changingSelection.current = false
    if (!source) { setState({ view: 'cancelled', action, question, stale: true }); return }
    if (action === 'Ask a question' && !question) { setState({ view: 'question', source, action }); return }
    const controller = new AbortController()
    request.current = controller
    setState({ view: 'loading', action, question, source })
    const shouldFail = () => {
      if (import.meta.env.DEV && window.__phase2Test?.explainFailures) { window.__phase2Test.explainFailures--; return true }
      return false
    }
    void requestExplanation({ action, question, selection: source, signal: controller.signal }, { shouldFail }).then(result => {
      if (request.current !== controller || controller.signal.aborted) return
      request.current = null
      setState({ view: 'result', action, question, source, result })
    }, () => {
      if (request.current !== controller) return
      request.current = null
      setState({ view: controller.signal.aborted ? 'cancelled' : 'error', action, question, source })
    })
  }, [editor, cancel])
  const suspend = () => { cancel(); setState(old => old.view === 'loading' ? { ...old, view: 'cancelled' } : old) }
  const back = () => { cancel(); setState(old => ({ view: 'menu', source: old.source, stale: old.stale })) }
  const cancelResponse = () => { cancel(); setState(old => ({ ...old, view: 'cancelled' })) }
  const apply = () => {
    if (!editor || !state.source || !state.result?.replacement) return
    changingSelection.current = true
    const applied = applyExplainRewrite(editor, state.source, state.result.replacement)
    changingSelection.current = false
    if (applied) close(false)
    else setState(old => ({ ...old, stale: true }))
  }
  return { state, trigger, open, close, run, back, cancelResponse, apply, suspend }
}
export type ExplainController = ReturnType<typeof useExplain>

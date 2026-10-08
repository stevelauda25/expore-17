import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import App from '../App'
import { useEditorEnvironment } from '../EditorEnvironment'
import { DocumentStore, browserStorage } from '../persistence/documentStore'
import { documentExtensions } from './document'
import { DocumentSearch, SelectionContextExtension } from './plugins'
import { FormattingToolbar } from './FormattingToolbar'
import { DocumentSearchInput, Outline } from './Navigation'
import { UIContext, initialUI, uiReducer } from './uiState'
import { SaveIndicator } from '../components/SaveIndicator'
import { ExplainExtension, explainKey } from './explainPlugin'
import { useExplain } from './useExplain'
import { ExplainPopover } from './ExplainPopover'
import { ExplainTriggers } from './ExplainTriggers'
import { CommentsExtension, commentsKey } from './comments'
import { CommentsPanel, HistoryPanel } from './DocumentPanels'
import appStyles from '../App.module.css'
import paperStyles from '../components/DocumentPaper.module.css'
import styles from './Editor.module.css'

export default function EditorApp() {
  const { active } = useEditorEnvironment()
  const [store] = useState(() => new DocumentStore({ ...browserStorage, delay: () => import.meta.env.DEV ? (window.__phase2Test?.saveDelay ?? 0) : 0 }))
  const save = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [state, dispatch] = useReducer(uiReducer, initialUI)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const [workspace, setWorkspace] = useState<HTMLDivElement | null>(null)
  const attachWorkspace = useCallback((node: HTMLDivElement | null) => { workspaceRef.current = node; setWorkspace(node) }, [])
  const editor = useEditor({
    extensions: [...documentExtensions, SelectionContextExtension, DocumentSearch, ExplainExtension, CommentsExtension.configure({ initial: store.getComments() })],
    content: store.initial,
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { class: styles.content, role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Proposal document', 'data-testid': 'document-editor', spellcheck: 'false' } },
    onTransaction: ({ editor, transaction }) => {
      if (transaction.docChanged || transaction.getMeta(commentsKey)) store.changed(editor.getJSON(), commentsKey.getState(editor.state))
    },
  })
  const explain = useExplain(editor, active)
  const title = useEditorState({ editor, selector: ({ editor }) => editor?.state.doc.firstChild?.textContent || 'Untitled document' })
  useEffect(() => {
    if (!editor) return
    store.start()
    const hidden = () => { if (document.visibilityState === 'hidden') store.flush() }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('pagehide', store.flush)
    if (import.meta.env.DEV && window.__phase2Test) window.__phase2Test.editor = editor
    return () => {
      store.stop()
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('pagehide', store.flush)
      if (import.meta.env.DEV && window.__phase2Test) delete window.__phase2Test.editor
    }
  }, [editor, store])
  useEffect(() => {
    if (!active) return
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); store.save() }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [active, store])
  if (!editor) return null
  const notice = save.error ?? state.notice
  const explainVisible = active && state.panelOpen && state.tab === 'Explain'
  const openExplain = (trigger: HTMLElement) => { dispatch({ type: 'tab', tab: 'Explain' }); explain.open(trigger) }
  return <UIContext.Provider value={{ state, dispatch }}><App workspaceRef={attachWorkspace} runtime={{
    panelOpen: state.panelOpen, bannerOpen: state.bannerOpen, tab: state.tab,
    setTab: tab => { if (tab !== 'Explain') explain.suspend(); dispatch({ type: 'tab', tab }) },
    closePanel: () => { explain.close(false); dispatch({ type: 'closePanel' }); document.querySelector<HTMLButtonElement>('[aria-label="Explain mode"]')?.focus({ preventScroll: true }) },
    dismissBanner: () => { dispatch({ type: 'dismissBanner' }); editor.view.focus() },
    comments: <CommentsPanel editor={editor} />,
    history: <HistoryPanel store={store} editor={editor} beforeRestore={() => explain.close(false)} />,
    title: title ?? 'Untitled document', outlineOpen: state.outlineOpen,
    explainMode: state.explainMode,
    toggleExplain: trigger => {
      const reopening = !state.panelOpen || state.tab !== 'Explain'
      const enabled = reopening || !state.explainMode
      if (reopening) dispatch({ type: 'openExplain' })
      else dispatch({ type: 'toggleExplain' })
      editor.view.dispatch(editor.state.tr.setMeta(explainKey, { enabled }))
      if (enabled) explain.open(trigger)
      else explain.close(false)
    },
    toggleOutline: () => dispatch({ type: 'toggleOutline' }),
    navigate: destination => dispatch({ type: 'notice', text: `${destination} is outside this document editor prototype.` }),
    search: <DocumentSearchInput editor={editor} workspaceRef={workspaceRef} />,
    outline: <Outline editor={editor} workspaceRef={workspaceRef} />,
    saveControls: <><span className={`${appStyles.saveStatus} ${save.status === 'error' ? styles.error : ''}`} role="status" data-testid="save-status" data-status={save.status}>{save.status === 'saving' && <SaveIndicator />}{({ saved: 'Saved', dirty: 'Unsaved changes', saving: 'Saving...', error: 'Save failed' })[save.status]}</span><button className={appStyles.saveButton} disabled={save.recoveryRequired} onClick={store.save}>{save.status === 'error' ? 'Retry save' : 'Save changes'}</button></>,
    document: <article className={paperStyles.paper} aria-label={title ?? 'Proposal'} data-testid="paper"><div className={paperStyles.textColumn} data-testid="text-column"><EditorContent editor={editor} /></div>{<FormattingToolbar editor={editor} workspace={workspace} onAsk={openExplain} explainOpen={explainVisible && explain.state.view !== 'closed'} />} {active && <ExplainTriggers editor={editor} workspace={workspace} enabled={state.explainMode && explainVisible} controller={explain} />}<ExplainPopover controller={explain} visible={explainVisible} /></article>,
    notice: notice && <div className={styles.notice} role={save.error ? 'alert' : 'status'}><p>{notice}</p>{save.error ? <button onClick={save.recoveryRequired ? store.recover : store.save}>{save.recoveryRequired ? 'Back up and retry' : 'Retry save'}</button> : <button onClick={() => dispatch({ type: 'notice', text: null })}>Dismiss</button>}</div>,
  }} /></UIContext.Provider>
}

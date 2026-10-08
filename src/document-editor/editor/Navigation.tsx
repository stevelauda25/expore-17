import { useEffect, useRef, type RefObject } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { Icon } from '../components/SourceAsset'
import { searchKey } from './plugins'
import { useUI } from './uiState'
import { useEditorEnvironment } from '../EditorEnvironment'
import appStyles from '../App.module.css'
import styles from './Editor.module.css'

function scrollWorkspaceTo(workspace: HTMLElement, target: HTMLElement, offset = 20) {
  workspace.scrollTop += target.getBoundingClientRect().top - workspace.getBoundingClientRect().top - offset
}
export function Outline({ editor, workspaceRef }: { editor: Editor; workspaceRef: RefObject<HTMLDivElement | null> }) {
  const { state, dispatch } = useUI()
  const { active: visible } = useEditorEnvironment()
  const headings = useEditorState({ editor, selector: ({ editor }) => {
    const result: { id: string; title: string }[] = []
    editor.state.doc.descendants(node => {
      if (node.type.name === 'heading' && node.attrs.level !== 1 && node.attrs.id) result.push({ id: node.attrs.id, title: node.textContent || 'Untitled section' })
    })
    return result
  } })
  useEffect(() => {
    if (!visible) return
    const workspace = workspaceRef.current!
    const update = () => {
      const top = workspace.getBoundingClientRect().top + 24
      let active = headings[0]?.id ?? ''
      for (const item of headings) {
        const node = document.getElementById(item.id)
        if (node && node.getBoundingClientRect().top <= top) active = item.id
      }
      // At the bottom, the last visible heading is the section the user reached.
      if (workspace.scrollTop + workspace.clientHeight >= workspace.scrollHeight - 2) active = headings.at(-1)?.id ?? active
      dispatch({ type: 'activeHeading', id: active })
    }
    workspace.addEventListener('scroll', update)
    const resize = new ResizeObserver(update)
    resize.observe(editor.view.dom)
    update()
    return () => { workspace.removeEventListener('scroll', update); resize.disconnect() }
  }, [editor, headings, workspaceRef, dispatch, visible])
  return headings.map((heading, index) => <button key={heading.id} className={`${appStyles.outlineRow} ${state.activeHeading === heading.id ? appStyles.outlineActive : ''}`} aria-current={state.activeHeading === heading.id ? 'location' : undefined} onClick={() => {
    const target = document.getElementById(heading.id)
    if (target && workspaceRef.current) { scrollWorkspaceTo(workspaceRef.current, target); dispatch({ type: 'activeHeading', id: heading.id }) }
  }}><span>{index + 1}.</span><span>{heading.title}</span></button>)
}

export function DocumentSearchInput({ editor, workspaceRef }: { editor: Editor; workspaceRef: RefObject<HTMLDivElement | null> }) {
  const { active } = useEditorEnvironment()
  const input = useRef<HTMLInputElement>(null)
  const search = useEditorState({ editor, selector: ({ editor }) => searchKey.getState(editor.state)! })
  const update = (query: string, index?: number) => {
    editor.view.dispatch(editor.state.tr.setMeta(searchKey, { query, index }))
    const target = editor.view.dom.querySelector<HTMLElement>('.search-current')
    if (target && workspaceRef.current) scrollWorkspaceTo(workspaceRef.current, target, 80)
  }
  useEffect(() => {
    if (!active) return
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); input.current?.focus(); input.current?.select() }
    }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [active])
  return <div className={appStyles.search}><Icon name="search" /><input ref={input} aria-label="Search document" placeholder="Search" value={search.query} onChange={event => update(event.target.value)} onKeyDown={event => {
    if (event.key === 'Enter') { event.preventDefault(); update(search.query, search.index + (event.shiftKey ? -1 : 1)) }
    if (event.key === 'Escape') { event.preventDefault(); update(''); editor.view.focus() }
  }} />{search.query && <><span className={styles.searchCount} role="status" aria-label="Search matches">{search.matches.length ? search.index + 1 : 0}/{search.matches.length}</span>
    <button className={styles.searchButton} aria-label="Previous match" disabled={!search.matches.length} onClick={() => update(search.query, search.index - 1)}>↑</button>
    <button className={styles.searchButton} aria-label="Next match" disabled={!search.matches.length} onClick={() => update(search.query, search.index + 1)}>↓</button>
    <button className={styles.searchButton} aria-label="Clear search" onClick={() => { update(''); input.current?.focus() }}>×</button></>}</div>
}

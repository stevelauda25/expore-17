import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react'
import { Orb } from '../components/SourceAsset'
import { explainKey } from './explainPlugin'
import type { ExplainController } from './useExplain'
import styles from './Explain.module.css'
import { editorFloatingPadding, useEditorEnvironment } from '../EditorEnvironment'

export function ExplainTriggers({ editor, enabled, workspace, controller }: { editor: Editor; enabled: boolean; workspace: HTMLElement | null; controller: ExplainController }) {
  const { portalRoot } = useEditorEnvironment()
  const [paragraph, setParagraph] = useState<HTMLElement | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { open, state } = controller
  const { refs, floatingStyles } = useFloating({ placement: 'right-start', strategy: 'fixed', middleware: [offset(8), flip(() => ({ padding: editorFloatingPadding() })), shift(() => ({ padding: editorFloatingPadding() }))], whileElementsMounted: autoUpdate })
  const { setReference, setFloating } = refs
  useEffect(() => {
    const dom = editor.view.dom
    const click = (event: MouseEvent) => {
      const marker = (event.target as Element)?.closest<HTMLElement>('[data-clause-marker], [data-clause-text]')
      if (!marker) return
      const index = Number(marker.dataset.clauseMarker ?? marker.dataset.clauseText)
      const range = explainKey.getState(editor.state)?.clauses.find(range => range.index === index)
      if (range) { event.preventDefault(); open(marker, range) }
    }
    const move = (event: MouseEvent) => {
      clearTimeout(leaveTimer.current)
      const p = (event.target as Element)?.closest<HTMLElement>('p') ?? null
      setParagraph(p); setReference(p)
    }
    const leave = (event: MouseEvent) => {
      if ((event.relatedTarget as Element)?.closest?.('[data-paragraph-explain]')) return
      leaveTimer.current = setTimeout(() => setParagraph(null), 150)
    }
    const scroll = () => setParagraph(null)
    dom.addEventListener('click', click)
    dom.addEventListener('mousemove', move)
    dom.addEventListener('mouseleave', leave)
    workspace?.addEventListener('scroll', scroll)
    return () => { clearTimeout(leaveTimer.current); dom.removeEventListener('click', click); dom.removeEventListener('mousemove', move); dom.removeEventListener('mouseleave', leave); workspace?.removeEventListener('scroll', scroll) }
  }, [editor, open, setReference, workspace])
  return enabled && paragraph && state.view === 'closed' && <FloatingPortal root={portalRoot}><button ref={setFloating} style={floatingStyles} className={styles.paragraph} data-paragraph-explain data-explain-trigger aria-label="Explain paragraph" aria-haspopup="dialog"
    onMouseDown={event => event.preventDefault()} onMouseEnter={() => clearTimeout(leaveTimer.current)} onMouseLeave={() => setParagraph(null)} onClick={event => {
      if (!paragraph.isConnected) return
      const from = editor.view.posAtDOM(paragraph, 0)
      const node = editor.state.doc.resolve(from).parent
      if (node.content.size) open(event.currentTarget, { from, to: from + node.content.size })
    }}><Orb />Explain</button></FloatingPortal>
}

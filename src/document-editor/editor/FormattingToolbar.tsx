import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { FloatingFocusManager, FloatingPortal, autoUpdate, flip, offset, shift, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react'
import { Icon, Orb } from '../components/SourceAsset'
import { restoreSelection, selectionKey } from './plugins'
import styles from './Editor.module.css'
import { editorFloatingPadding, useEditorEnvironment } from '../EditorEnvironment'

export function FormattingToolbar({ editor, workspace, onAsk, explainOpen }: { editor: Editor; workspace: HTMLElement | null; onAsk: (trigger: HTMLElement) => void; explainOpen: boolean }) {
  const { portalRoot, active: editorActive } = useEditorEnvironment()
  const menuRef = useRef<HTMLDivElement>(null)
  const [colorOpen, setColorOpen] = useState(false)
  const { refs: { setReference, setFloating }, floatingStyles, context } = useFloating<HTMLButtonElement>({ open: colorOpen, onOpenChange: setColorOpen, placement: 'bottom-start', middleware: [offset(8), flip(() => ({ padding: editorFloatingPadding() })), shift(() => ({ padding: editorFloatingPadding() }))], whileElementsMounted: (reference, floating, update) => autoUpdate(reference, floating, update, { animationFrame: true }) })
  const dismiss = useDismiss(context), role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role])
  const active = useEditorState({ editor, selector: ({ editor }) => ({ bold: editor.isActive('bold'), italic: editor.isActive('italic'), underline: editor.isActive('underline'), strike: editor.isActive('strike'), highlight: editor.isActive('highlight'), color: editor.getAttributes('textStyle').color as string | undefined }) })
  const options = useMemo(() => ({ strategy: 'fixed' as const, placement: 'top' as const, offset: 8, flip: () => ({ padding: editorFloatingPadding() }), shift: () => ({ padding: editorFloatingPadding() }), scrollTarget: workspace ?? window }), [workspace])
  // TipTap's default anchor only spans the two endpoint carets. A DOM Range
  // includes all selected lines and stays correct when a toolbar owns focus.
  const selectionBounds = useCallback(() => ({ getBoundingClientRect: () => {
    const { from, to } = editor.state.selection
    const start = editor.view.domAtPos(from), end = editor.view.domAtPos(to)
    const range = document.createRange()
    range.setStart(start.node, start.offset); range.setEnd(end.node, end.offset)
    const rect = range.getBoundingClientRect()
    const block = (start.node instanceof Element ? start.node : start.node.parentElement)?.closest('p,h1,h2,h3,li')
    if (!block) return rect
    const lineHeight = parseFloat(getComputedStyle(block).lineHeight)
    const leading = Math.max(0, (lineHeight - (range.getClientRects()[0]?.height ?? lineHeight)) / 2)
    const multiLine = rect.height > lineHeight && editor.state.selection.$from.sameParent(editor.state.selection.$to)
    const blockRect = block.getBoundingClientRect()
    return new DOMRect(multiLine ? blockRect.x : rect.x, rect.y - leading, multiLine ? blockRect.width : rect.width, rect.height + leading * 2)
  } }), [editor])
  const shouldShow = useCallback(() => editorActive && !editor.state.selection.empty && !selectionKey.getState(editor.state)?.dismissed && (editor.isFocused || !!menuRef.current?.contains(document.activeElement) || colorOpen || explainOpen), [editor, colorOpen, explainOpen, editorActive])
  const closeToolbar = useCallback(() => {
    editor.view.focus()
    editor.view.dispatch(editor.state.tr.setMeta(selectionKey, 'dismiss').setMeta('formattingMenu', 'hide'))
  }, [editor])
  useEffect(() => {
    if (!workspace || !editorActive) return
    const update = () => { if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta('formattingMenu', 'updatePosition')) }
    workspace.addEventListener('scroll', update)
    const observer = new ResizeObserver(update)
    observer.observe(workspace)
    return () => { workspace.removeEventListener('scroll', update); observer.disconnect() }
  }, [editor, workspace, editorActive])
  useEffect(() => {
    if (!editorActive) {
      editor.view.dispatch(editor.state.tr.setMeta('formattingMenu', 'hide'))
      return
    }
    const keydown = (event: KeyboardEvent) => {
      if (editor.state.selection.empty) return
      if (menuRef.current?.contains(document.activeElement) && ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        const buttons = Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>('button:not([aria-disabled="true"])'))
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
        event.preventDefault(); buttons[next]?.focus()
      }
      if ((event.key === 'F10' || event.key === 'Tab') && editor.isFocused && !event.shiftKey) {
        event.preventDefault()
        menuRef.current?.querySelector<HTMLButtonElement>('[aria-label="Bold"]')?.focus()
      }
      if (event.key === 'Escape' && !colorOpen && (editor.isFocused || menuRef.current?.contains(document.activeElement))) { event.preventDefault(); closeToolbar() }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [editor, colorOpen, closeToolbar, editorActive])
  const applyColor = (color: string | null) => {
    restoreSelection(editor)
    if (color) editor.chain().setColor(color).run()
    else editor.chain().unsetColor().run()
    setColorOpen(false)
  }
  return <>
    <BubbleMenu editor={editor} pluginKey="formattingMenu" ref={menuRef} appendTo={() => portalRoot} getReferencedVirtualElement={selectionBounds} updateDelay={0} options={options} shouldShow={shouldShow}
      className={styles.toolbar} role="toolbar" aria-label="Text formatting" data-testid="formatting-toolbar"
      onMouseDown={event => event.preventDefault()}
      >
      <button className={styles.ask} data-explain-trigger aria-haspopup="dialog" aria-expanded={explainOpen} onClick={event => { setColorOpen(false); onAsk(event.currentTarget) }}><Orb />Ask AI</button><Icon name="toolbar-divider" />
      {([
        ['bold', 'Bold', 'bold', () => editor.chain().toggleBold().run()],
        ['italic', 'Italic', 'italic', () => editor.chain().toggleItalic().run()],
        ['underline', 'Underline', 'underline', () => editor.chain().toggleUnderline().run()],
        ['strike', 'Strikethrough', 'strikethrough', () => editor.chain().toggleStrike().run()],
      ] as const).map(([mark, label, icon, command]) => <button key={mark} aria-label={label} title={label} aria-pressed={active[mark]} onClick={() => { restoreSelection(editor); command() }}><Icon name={icon} /></button>)}
      <Icon name="toolbar-divider" /><button ref={setReference} {...getReferenceProps()} className={styles.colorControl} aria-label="Text color" aria-expanded={colorOpen} onClick={() => setColorOpen(!colorOpen)}>Text<span className={styles.swatch} style={{ background: active.color ?? '#333' }} /></button>
      <Icon name="toolbar-divider" /><button className={styles.colorControl} aria-label="Highlight" aria-pressed={active.highlight} onClick={() => { restoreSelection(editor); editor.chain().toggleHighlight({ color: '#f3f9fe' }).run() }}>Highlight<Icon name="highlight" /></button>
    </BubbleMenu>
    {editorActive && colorOpen && <FloatingPortal root={portalRoot}><FloatingFocusManager context={context} modal={false} returnFocus={!document.activeElement?.closest('[aria-label="UI explorations"]')}>
      <div ref={setFloating} style={floatingStyles} {...getFloatingProps()} className={styles.palette} aria-label="Text color choices">
        <button onClick={() => applyColor('#333333')}><span className={styles.swatch} />Default</button>
        <button onClick={() => applyColor('#1687ef')}><span className={styles.swatch} style={{ background: '#1687ef' }} />Blue</button>
        <button onClick={() => applyColor(null)}>Reset color</button>
      </div>
    </FloatingFocusManager></FloatingPortal>}
  </>
}

import { useRef, useState } from 'react'
import { generateHTML, type Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { closeHistory } from '@tiptap/pm/history'
import type { DocumentStore } from '../persistence/documentStore'
import { documentExtensions } from './document'
import { explainKey, findExplainClauses } from './explainPlugin'
import { commentsKey, isComment, type CommentThread } from './comments'
import { getSelectionContext, restoreSelection } from './plugins'
import styles from './Panels.module.css'

function Timestamp({ value }: { value: string }) {
  return <time dateTime={value}>{new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })}</time>
}
function Thread({ item, update, editor }: { item: CommentThread; update: (item: CommentThread) => void; editor: Editor }) {
  const [reply, setReply] = useState('')
  return <article className={styles.card} aria-label={`Comment: ${item.text}`}>
    <div className={styles.meta}><Timestamp value={item.createdAt} /><span>{item.resolved ? 'Resolved' : 'Open'}</span></div>
    {item.anchor ? <><blockquote>{item.anchor.quote}</blockquote>{item.anchor.detached ? <p className={styles.meta}>Detached — quoted text was removed.</p> : <button onClick={() => { editor.commands.setTextSelection({ from: item.anchor!.from, to: item.anchor!.to }); restoreSelection(editor); editor.commands.scrollIntoView() }}>Show quoted text</button>}</> : <p className={styles.meta}>Document comment</p>}
    <p className={styles.prose}>{item.text}</p>
    <button onClick={() => update({ ...item, resolved: !item.resolved })}>{item.resolved ? 'Reopen' : 'Resolve'}</button>
    {item.replies.map(message => <div className={styles.reply} key={message.id}><Timestamp value={message.createdAt} /><p className={styles.prose}>{message.text}</p></div>)}
    <form onSubmit={event => { event.preventDefault(); if (!reply.trim()) return; update({ ...item, replies: [...item.replies, { id: crypto.randomUUID(), text: reply.trim(), createdAt: new Date().toISOString() }] }); setReply('') }}>
      <label htmlFor={`reply-${item.id}`}>Reply</label>
      <textarea id={`reply-${item.id}`} value={reply} onChange={event => setReply(event.target.value)} rows={2} />
      <button type="submit" disabled={!reply.trim()}>Add reply</button>
    </form>
  </article>
}
export function CommentsPanel({ editor }: { editor: Editor }) {
  const [text, setText] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)
  const data = useEditorState({ editor, selector: ({ editor }) => ({ comments: commentsKey.getState(editor.state)!, selection: getSelectionContext(editor) }) })
  const change = (comments: unknown[]) => editor.view.dispatch(editor.state.tr.setMeta(commentsKey, comments))
  const add = (selected: boolean) => {
    const source = selected ? getSelectionContext(editor) : null
    if (!text.trim() || (selected && !source)) return
    const item: CommentThread = { kind: 'comment', id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString(), resolved: false, replies: [], anchor: source ? { from: source.from, to: source.to, quote: source.text, detached: false } : null }
    change([...data.comments, item]); setText(''); input.current?.focus({ preventScroll: true })
  }
  const comments = data.comments.filter(isComment)
  return <div className={styles.body}>
    <form onSubmit={event => { event.preventDefault(); add(false) }}>
      <label htmlFor="new-comment">New comment</label>
      <textarea ref={input} id="new-comment" value={text} onChange={event => setText(event.target.value)} rows={3} />
      {data.selection && <p className={styles.quote} title={data.selection.text}>Selected: {data.selection.text}</p>}
      <div className={styles.actions}><button type="submit" disabled={!text.trim()}>Add document comment</button><button type="button" disabled={!text.trim() || !data.selection} onClick={() => add(true)}>Comment on selection</button></div>
    </form>
    <p role="status" className={styles.meta}>{comments.length ? `${comments.length} comment${comments.length === 1 ? '' : 's'} · ${comments.filter(item => !item.resolved).length} open` : 'No comments yet.'}</p>
    {comments.map(item => <Thread key={item.id} item={item} editor={editor} update={updated => change(data.comments.map(value => value === item ? updated : value))} />)}
  </div>
}
export function HistoryPanel({ store, editor, beforeRestore }: { store: DocumentStore; editor: Editor; beforeRestore: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const revisions = store.getRevisions()
  const revision = revisions.find(item => item.id === selected)
  const html = (() => {
    if (!revision) return ''
    const template = document.createElement('template')
    template.innerHTML = generateHTML(revision.document, documentExtensions)
    template.content.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'))
    return template.innerHTML
  })()
  const restore = () => {
    if (!revision) return
    const target = store.restore(revision.id)
    if (!target) { setMessage('Restoration stopped. The document could not be saved; your current document is unchanged. Resolve the save error, then restore again.'); return }
    beforeRestore()
    const doc = editor.schema.nodeFromJSON(target.document)
    editor.view.dispatch(closeHistory(editor.state.tr).replaceWith(0, editor.state.doc.content.size, doc.content).setMeta(commentsKey, target.comments).setMeta(explainKey, { source: null, clauses: findExplainClauses(doc) }))
    editor.view.dispatch(closeHistory(editor.state.tr))
    setSelected(null)
    setMessage('Revision restored. Your previous document is preserved in History.')
    document.getElementById('tab-History')?.focus({ preventScroll: true })
  }
  return <div className={styles.body}>
    <p className={styles.meta}>Up to 50 distinct saved revisions on this device. Preview leaves your document unchanged.</p>
    {message && <p role={message.startsWith('Restoration stopped') ? 'alert' : 'status'}>{message}</p>}
    {revision && <section className={styles.card} aria-label="Revision preview">
      <h2>Revision preview</h2><Timestamp value={revision.savedAt} />
      <p className={styles.meta}>{revision.comments.filter(isComment).length} comment{revision.comments.filter(isComment).length === 1 ? '' : 's'} in this revision</p>
      <div className={styles.preview} role="document" tabIndex={0} aria-label="Preview document" dangerouslySetInnerHTML={{ __html: html }} />
      <p className={styles.meta}>Restoring also restores this revision’s comments. Your current document will be saved first.</p>
      <div className={styles.actions}><button disabled={store.getSnapshot().recoveryRequired} onClick={restore}>Restore revision</button><button onClick={() => { setSelected(null); Array.from(document.querySelectorAll<HTMLButtonElement>('[data-revision-id]')).find(button => button.dataset.revisionId === revision.id)?.focus() }}>Close preview</button></div>
    </section>}
    {!revisions.length && <p>No saved revisions yet.</p>}
    <ol className={styles.revisions}>{[...revisions].reverse().map((item, index) => <li key={item.id}><button data-revision-id={item.id} aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); setMessage('') }}><span>{index === 0 ? 'Latest saved revision' : `Saved revision ${revisions.length - index}`}</span><Timestamp value={item.savedAt} /></button></li>)}</ol>
  </div>
}

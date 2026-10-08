import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { Mapping } from '@tiptap/pm/transform'

export interface CommentReply { id: string; text: string; createdAt: string }
export interface CommentThread extends CommentReply {
  kind: 'comment'
  resolved: boolean
  replies: CommentReply[]
  anchor: { from: number; to: number; quote: string; detached: boolean } | null
}
const validMessage = (value: unknown): value is CommentReply => {
  const item = value as CommentReply | null
  return !!item && typeof item.id === 'string' && typeof item.text === 'string' && Number.isFinite(Date.parse(item.createdAt))
}
export function isComment(value: unknown): value is CommentThread {
  const item = value as CommentThread | null
  return validMessage(item) && item.kind === 'comment' && typeof item.resolved === 'boolean' && Array.isArray(item.replies) && item.replies.every(validMessage) && (item.anchor === null || (!!item.anchor && Number.isInteger(item.anchor.from) && Number.isInteger(item.anchor.to) && typeof item.anchor.quote === 'string' && typeof item.anchor.detached === 'boolean'))
}
export function mapComments(comments: unknown[], mapping: Mapping, size: number): unknown[] {
  let changed = false
  const next = comments.map(item => {
    if (!isComment(item) || !item.anchor || item.anchor.detached) return item
    let { from, to } = item.anchor
    let detached = false
    for (const step of mapping.maps.slice(mapping.from, mapping.to)) {
      step.forEach((start, end) => { if (end > start && start <= from && end >= to) detached = true })
      from = step.map(from, 1); to = step.map(to, -1)
      if (from >= to) detached = true
    }
    detached ||= from < 0 || to > size
    if (from === item.anchor.from && to === item.anchor.to && !detached) return item
    changed = true
    return { ...item, anchor: { ...item.anchor, from, to, detached } }
  })
  return changed ? next : comments
}
export const commentsKey = new PluginKey<unknown[]>('comments')
export const CommentsExtension = Extension.create<{ initial: unknown[] }>({
  name: 'comments',
  addOptions: () => ({ initial: [] }),
  addProseMirrorPlugins() {
    const initial = this.options.initial
    return [new Plugin({ key: commentsKey, state: {
      init: (_, state) => initial.map(item => isComment(item) && item.anchor && (item.anchor.from < 0 || item.anchor.to > state.doc.content.size || item.anchor.from >= item.anchor.to) ? { ...item, anchor: { ...item.anchor, detached: true } } : item),
      apply: (tr, previous) => tr.getMeta(commentsKey) ?? (tr.docChanged ? mapComments(previous, tr.mapping, tr.doc.content.size) : previous),
    } })]
  },
})

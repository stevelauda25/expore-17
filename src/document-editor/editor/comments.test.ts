import { describe, expect, it } from 'vitest'
import { Mapping, StepMap } from '@tiptap/pm/transform'
import { mapComments, isComment, type CommentThread } from './comments'
const comment: CommentThread = { kind: 'comment', id: '1', text: 'Review', createdAt: '2026-10-08T00:00:00.000Z', resolved: false, replies: [], anchor: { from: 10, to: 20, quote: 'keep quote', detached: false } }
describe('comment anchors', () => {
  it('maps insertions before, inside, and at the range boundaries without losing the quote', () => {
    for (const [position, from, to] of [[2, 13, 23], [15, 10, 23], [10, 13, 23], [20, 10, 20]]) {
      const result = mapComments([comment], new Mapping([new StepMap([position, 0, 3])]), 100) as CommentThread[]
      expect(result[0].anchor).toEqual({ from, to, quote: 'keep quote', detached: false })
    }
  })
  it('retains detached quotes after deletion, replacement and later edits', () => {
    for (const inserted of [0, 5]) {
      const result = mapComments([comment], new Mapping([new StepMap([10, 10, inserted])]), 100) as CommentThread[]
      expect(result[0].anchor?.detached).toBe(true)
      expect(result[0].anchor?.quote).toBe('keep quote')
      expect(mapComments(result, new Mapping([new StepMap([1, 0, 50])]), 150)).toBe(result)
    }
  })
  it('preserves document comments and opaque legacy metadata, and rejects malformed display data', () => {
    const data = [{ ...comment, anchor: null }, { id: 'legacy', quote: 'keep' }]
    expect(mapComments(data, new Mapping([new StepMap([0, 40, 0])]), 10)).toBe(data)
    expect(isComment({ ...comment, replies: [null] })).toBe(false)
    expect(isComment({ ...comment, anchor: { quote: 'bad' } })).toBe(false)
  })
})

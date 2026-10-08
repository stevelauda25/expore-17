import { afterEach, expect, it, vi } from 'vitest'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { getSchema } from '@tiptap/core'
import { documentExtensions, initialDocument } from './document'
import { createExplainPlugin, explainKey } from './explainPlugin'
import { findMatches } from './plugins'
import { generateExplainResult, requestExplanation } from './explainService'
import { proposal } from '../content/proposal'
const schema = getSchema(documentExtensions)
const selection = { from: 1, to: 20, text: proposal.summary, version: 3 }
afterEach(() => vi.useRealTimers())
it('waits 600 ms, is deterministic, aborts, and supports an injected failure followed by retry', async () => {
  vi.useFakeTimers()
  const controller = new AbortController()
  const request = { action: 'Summary' as const, selection, signal: controller.signal }
  const done = vi.fn()
  const pending = requestExplanation(request).then(done)
  await vi.advanceTimersByTimeAsync(599)
  expect(done).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  await pending
  expect(done).toHaveBeenCalledWith(generateExplainResult(request))
  const cancelled = requestExplanation(request)
  const rejection = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' })
  controller.abort()
  await rejection
  expect(vi.getTimerCount()).toBe(0)
  const fresh = { ...request, signal: new AbortController().signal }
  const failed = expect(requestExplanation(fresh, { shouldFail: () => true })).rejects.toThrow('could not be generated')
  await vi.advanceTimersByTimeAsync(600); await failed
  const retried = requestExplanation(fresh)
  await vi.advanceTimersByTimeAsync(600)
  expect(await retried).toEqual(generateExplainResult(request))
})
it('grounds questions only in their passage, deduplicates points, and simplifies edited text', () => {
  const unknown = generateExplainResult({ action: 'Ask a question', selection, question: 'What is the price?' })
  expect(unknown.text).toContain('does not supply the answer')
  expect(generateExplainResult({ action: 'Ask a question', selection, question: 'What does this mean for the project?' }).text).toContain('Bloom')
  const edited = { ...selection, text: 'We utilize a comprehensive plan; it will facilitate work. Repeat. Repeat.' }
  expect(generateExplainResult({ action: 'Simplify', selection: edited }).text).toBe('We use a complete plan. it will help work. Repeat. Repeat.')
  expect(generateExplainResult({ action: 'Key points', selection: edited }).points).toHaveLength(2)
  expect(generateExplainResult({ action: 'Rewrite', selection: { ...selection, text: 'We really utilize this in order to help.' } }).replacement).toBe('We use this to help.')
})
it('maps all three original clauses while disabled; decorations never enter document JSON', () => {
  let state = EditorState.create({ schema, doc: schema.nodeFromJSON(initialDocument), plugins: [createExplainPlugin()] })
  const original = explainKey.getState(state)!
  expect(original.enabled).toBe(false)
  expect(original.clauses).toHaveLength(3)
  state = state.apply(state.tr.insertText('Prefix ', 1))
  expect(explainKey.getState(state)!.clauses[0].from).toBe(original.clauses[0].from + 7)
  const json = state.doc.toJSON()
  state = state.apply(state.tr.setMeta(explainKey, { enabled: true }))
  expect(state.doc.toJSON()).toEqual(json)
  const range = explainKey.getState(state)!.clauses[1]
  state = state.apply(state.tr.delete(range.from, range.to))
  expect(explainKey.getState(state)!.clauses).toHaveLength(2)
})
it('pins and maps source independently of selection, and stale remains sticky after edits are reverted', () => {
  let state = EditorState.create({ schema, doc: schema.nodeFromJSON(initialDocument), plugins: [createExplainPlugin()] })
  const range = findMatches(state.doc, proposal.summary)[0]
  const bookmark = TextSelection.create(state.doc, range.from, range.to).getBookmark()
  state = state.apply(state.tr.setMeta(explainKey, { source: { bookmark, context: { ...range, text: proposal.summary, version: 0 }, stale: false } }))
  state = state.apply(state.tr.insertText('Prefix ', 1))
  let source = explainKey.getState(state)!.source!
  expect(source.stale).toBe(false)
  expect(source.bookmark.resolve(state.doc).from).toBe(range.from + 7)
  const at = source.bookmark.resolve(state.doc).from
  state = state.apply(state.tr.insertText('X', at))
  expect(explainKey.getState(state)!.source!.stale).toBe(true)
  state = state.apply(state.tr.delete(at, at + 1))
  source = explainKey.getState(state)!.source!
  expect(source.stale).toBe(true)
  const mapped = source.bookmark.resolve(state.doc)
  expect(state.doc.textBetween(mapped.from, mapped.to, ' ')).toBe(proposal.summary)
})

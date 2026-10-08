import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentStore, STORAGE_KEY, parseStored, type StorageAdapter } from './documentStore'
import { initialDocument } from '../editor/document'

const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })
function memory() {
  const data = new Map<string, string>()
  const storage: StorageAdapter = { read: key => data.get(key) ?? null, write: (key, value) => { data.set(key, value) } }
  return { data, storage }
}
describe('document persistence', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('marks dirty immediately, debounces 800 ms, and saves only after the write', () => {
    const { data, storage } = memory(), store = new DocumentStore({ ...storage, delay: () => 50 })
    store.changed(doc('a'))
    vi.advanceTimersByTime(700); store.changed(doc('b'))
    vi.advanceTimersByTime(799)
    expect(store.getSnapshot().status).toBe('dirty')
    expect(data.size).toBe(0)
    vi.advanceTimersByTime(1)
    expect(store.getSnapshot().status).toBe('saving')
    vi.advanceTimersByTime(50)
    expect(store.getSnapshot().status).toBe('saved')
    expect(new DocumentStore(storage).initial).toEqual(doc('b'))
  })
  it('manual and page-hide flush use the newest content, canceling older pending writes', () => {
    const { storage } = memory(), store = new DocumentStore({ ...storage, delay: () => 2000 })
    store.changed(doc('old')); store.save(); store.changed(doc('new')); store.flush()
    vi.runAllTimers()
    expect(new DocumentStore(storage).initial).toEqual(doc('new'))
  })
  it('keeps 50 distinct revisions and does not add unchanged saves', () => {
    const { storage } = memory(), store = new DocumentStore(storage)
    for (let i = 0; i < 55; i++) { store.changed(doc(String(i))); store.flush() }
    store.flush(); store.flush()
    const saved = parseStored(storage.read(STORAGE_KEY)!)
    expect(saved.revisions).toHaveLength(50)
    expect(saved.revisions[0].document).toEqual(doc('5'))
    store.changed(doc('10')); store.flush()
    const revisited = parseStored(storage.read(STORAGE_KEY)!)
    expect(revisited.revisions).toHaveLength(50)
    expect(revisited.revisions.at(-1)?.document).toEqual(doc('10'))
  })
  it('retains original data after malformed, unsupported schema, or invalid document loads', () => {
    for (const raw of ['{broken', '{"schemaVersion":9}', JSON.stringify({ schemaVersion: 1, document: { type: 'doc', content: [{ type: 'unknown' }] }, comments: [], revisions: [], savedAt: new Date().toISOString() })]) {
      const { storage } = memory(); storage.write(STORAGE_KEY, raw)
      const store = new DocumentStore(storage)
      store.changed(doc('new')); store.flush()
      expect(storage.read(STORAGE_KEY)).toBe(raw)
      expect(store.getSnapshot().recoveryRequired).toBe(true)
      expect(store.initial).toEqual(initialDocument)
    }
  })
  it('backs up raw data before replacement and refuses replacement when backup fails', () => {
    const { storage, data } = memory(); storage.write(STORAGE_KEY, 'broken')
    let fail = true
    const store = new DocumentStore({ ...storage, write: (key, value) => { if (fail) throw Error('quota'); storage.write(key, value) } })
    store.recover()
    expect(store.getSnapshot().recoveryRequired).toBe(true)
    expect(data.get(STORAGE_KEY)).toBe('broken')
    fail = false; store.recover(); vi.runAllTimers()
    expect([...data.entries()].some(([key, value]) => key.includes(':backup:') && value === 'broken')).toBe(true)
    expect(store.getSnapshot().status).toBe('saved')
  })
  it('reports write failures without losing edits; retry succeeds', () => {
    const { storage } = memory(); let fail = true
    const store = new DocumentStore({ ...storage, write: (key, value) => { if (fail) throw Error('quota'); storage.write(key, value) } })
    store.changed(doc('keep me')); store.flush()
    expect(store.getSnapshot().status).toBe('error')
    fail = false; store.save(); vi.runAllTimers()
    expect(new DocumentStore(storage).initial).toEqual(doc('keep me'))
  })
  it('handles blocked reads and requires a successful recovery', () => {
    const { storage } = memory(); let fail = true
    const store = new DocumentStore({ ...storage, read: key => { if (fail) throw Error('blocked'); return storage.read(key) } })
    store.changed(doc('offline')); store.recover()
    expect(store.getSnapshot().status).toBe('error')
    fail = false; store.recover(); vi.runAllTimers()
    expect(new DocumentStore(storage).initial).toEqual(doc('offline'))
  })
  it('protects changes from another tab before every write', () => {
    const { storage } = memory(), a = new DocumentStore(storage), b = new DocumentStore(storage)
    a.changed(doc('A')); a.flush(); b.changed(doc('B')); b.flush()
    expect(b.getSnapshot().recoveryRequired).toBe(true)
    expect(new DocumentStore(storage).initial).toEqual(doc('A'))
  })
  it('preserves existing comments and revision metadata through editing', () => {
    const { storage } = memory(), store = new DocumentStore(storage)
    store.flush()
    const saved = parseStored(storage.read(STORAGE_KEY)!)
    saved.comments = [{ id: 'future-comment', quote: 'keep', replies: [] }]
    storage.write(STORAGE_KEY, JSON.stringify(saved))
    const next = new DocumentStore(storage); next.changed(doc('edited')); next.flush()
    const result = parseStored(storage.read(STORAGE_KEY)!)
    expect(result.comments).toEqual(saved.comments)
    expect(result.revisions[0]).toEqual(saved.revisions[0])
  })
})

describe('revision restoration', () => {
  it('saves current content and comments first; restores both and retains deduplication', () => {
    const { storage } = memory(), store = new DocumentStore(storage)
    store.changed(doc('old'), [{ legacy: 'old comment' }]); store.flush()
    const target = store.getRevisions()[0].id
    store.changed(doc('current'), [{ legacy: 'current comment' }])
    expect(store.restore(target)?.document).toEqual(doc('old'))
    const saved = parseStored(storage.read(STORAGE_KEY)!)
    expect(saved.comments).toEqual([{ legacy: 'old comment' }])
    expect(saved.revisions.map(item => item.document)).toEqual([doc('current'), doc('old')])
    store.restore(saved.revisions.at(-1)!.id)
    expect(store.getRevisions()).toHaveLength(2)
  })
  it('stops before restoration if the current save fails, including external conflicts', () => {
    const { storage } = memory(); let fail = false
    const store = new DocumentStore({ ...storage, write: (k, v) => { if (fail) throw Error('quota'); storage.write(k, v) } })
    store.changed(doc('old')); store.flush(); const id = store.getRevisions()[0].id
    store.changed(doc('unsaved')); fail = true
    expect(store.restore(id)).toBeNull()
    expect(store.getRevisions()).toHaveLength(1)
    fail = false; store.flush()
    expect(parseStored(storage.read(STORAGE_KEY)!).document).toEqual(doc('unsaved'))
    storage.write(STORAGE_KEY, 'external')
    expect(store.restore(id)).toBeNull()
    expect(storage.read(STORAGE_KEY)).toBe('external')
  })
  it('leaves current content durable and in memory if the replacement write fails', () => {
    const { storage } = memory(); let writes = 0, failure = Infinity
    const store = new DocumentStore({ ...storage, write: (k, v) => { if (++writes === failure) throw Error('quota'); storage.write(k, v) } })
    store.changed(doc('old')); store.flush(); const id = store.getRevisions()[0].id
    store.changed(doc('current')); failure = writes + 2
    expect(store.restore(id)).toBeNull()
    expect(parseStored(storage.read(STORAGE_KEY)!).document).toEqual(doc('current'))
    store.flush()
    expect(parseStored(storage.read(STORAGE_KEY)!).document).toEqual(doc('current'))
  })
})

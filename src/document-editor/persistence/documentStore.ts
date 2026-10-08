import type { JSONContent } from '@tiptap/core'
import { initialDocument, validateDocument } from '../editor/document'

export const STORAGE_KEY = 'proposal-editor:document:v1'
export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'
export interface Revision { id: string; savedAt: string; document: JSONContent; comments: unknown[] }
export interface PersistedDocument {
  schemaVersion: 1
  document: JSONContent
  comments: unknown[]
  savedAt: string
  revisions: Revision[]
}
export interface StorageAdapter { read(key: string): string | null; write(key: string, value: string): void; delay?: () => number }
export const browserStorage: StorageAdapter = {
  read: key => localStorage.getItem(key), write: (key, value) => localStorage.setItem(key, value),
}
interface Snapshot { status: SaveStatus; error: string | null; recoveryRequired: boolean }
const fingerprint = (document: JSONContent, comments: unknown[]) => JSON.stringify({ document, comments })

export function parseStored(raw: string): PersistedDocument {
  const value = JSON.parse(raw) as PersistedDocument
  if (value?.schemaVersion !== 1 || !Array.isArray(value.comments) || !Array.isArray(value.revisions) || !Number.isFinite(Date.parse(value.savedAt))) throw new Error('Unsupported or malformed saved document')
  validateDocument(value.document)
  for (const revision of value.revisions) {
    if (!revision || typeof revision.id !== 'string' || !Array.isArray(revision.comments) || !Number.isFinite(Date.parse(revision.savedAt))) throw new Error('Malformed saved revision')
    validateDocument(revision.document)
  }
  return value
}

/** Owns persistence, never editor transactions. Writes the newest snapshot atomically. */
export class DocumentStore {
  readonly initial: JSONContent
  private document: JSONContent
  private comments: unknown[] = []
  private revisions: Revision[] = []
  private baseline: string | null = null
  private savedFingerprint: string | null = null
  private snapshot: Snapshot = { status: 'dirty', error: null, recoveryRequired: false }
  private listeners = new Set<() => void>()
  private idleTimer?: ReturnType<typeof setTimeout>
  private writeTimer?: ReturnType<typeof setTimeout>

  private storage: StorageAdapter
  constructor(storage: StorageAdapter = browserStorage) {
    this.storage = storage
    this.document = initialDocument
    try {
      this.baseline = storage.read(STORAGE_KEY)
      if (this.baseline !== null) {
        const loaded = parseStored(this.baseline)
        this.document = loaded.document
        this.comments = loaded.comments
        this.revisions = loaded.revisions
        this.savedFingerprint = fingerprint(this.document, this.comments)
        this.snapshot = { status: 'saved', error: null, recoveryRequired: false }
      }
    } catch {
      this.snapshot = { status: 'error', error: 'Saved data could not be opened. It has been left untouched. Back it up before saving this document.', recoveryRequired: true }
    }
    this.initial = this.document
  }
  getComments = () => this.comments
  getRevisions = () => this.revisions
  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private publish(value: Snapshot) { this.snapshot = value; this.listeners.forEach(listener => listener()) }
  start() { if (this.snapshot.status === 'dirty') this.schedule() }
  stop() { clearTimeout(this.idleTimer); clearTimeout(this.writeTimer) }
  changed(document: JSONContent, comments = this.comments) {
    this.document = document
    this.comments = comments
    clearTimeout(this.writeTimer)
    if (this.snapshot.recoveryRequired) return
    this.publish({ status: 'dirty', error: null, recoveryRequired: false })
    this.schedule()
  }
  private schedule() { clearTimeout(this.idleTimer); this.idleTimer = setTimeout(() => this.save(), 800) }
  save = () => {
    clearTimeout(this.idleTimer)
    clearTimeout(this.writeTimer)
    if (this.snapshot.recoveryRequired) return
    this.publish({ status: 'saving', error: null, recoveryRequired: false })
    // Yield one frame for the real pending state; tests can hold the actual write.
    this.writeTimer = setTimeout(() => this.flush(), this.storage.delay?.() ?? 0)
  }
  flush = () => {
    this.stop()
    if (this.snapshot.recoveryRequired) return false
    try {
      if (this.storage.read(STORAGE_KEY) !== this.baseline) {
        this.publish({ status: 'error', error: 'Saved data changed in another window. Back it up before saving this version.', recoveryRequired: true })
        return false
      }
      const nextFingerprint = fingerprint(this.document, this.comments)
      if (this.savedFingerprint !== nextFingerprint) {
        const savedAt = new Date().toISOString()
        const revision: Revision = { id: crypto.randomUUID(), savedAt, document: this.document, comments: this.comments }
        const revisions = [...this.revisions.filter(item => fingerprint(item.document, item.comments) !== nextFingerprint), revision].slice(-50)
        const payload: PersistedDocument = { schemaVersion: 1, document: this.document, comments: this.comments, savedAt, revisions }
        const raw = JSON.stringify(payload)
        this.storage.write(STORAGE_KEY, raw)
        this.baseline = raw
        this.revisions = revisions
        this.savedFingerprint = nextFingerprint
      }
      this.publish({ status: 'saved', error: null, recoveryRequired: false })
      return true
    } catch {
      this.publish({ status: 'error', error: 'Changes could not be saved on this device. Keep this page open and retry.', recoveryRequired: false })
      return false
    }
  }
  restore = (id: string): Revision | null => {
    const target = this.revisions.find(revision => revision.id === id)
    if (!target || !this.flush()) return null
    // The current version is durable before attempting the restoration write.
    const currentDocument = this.document, currentComments = this.comments
    this.document = target.document
    this.comments = target.comments
    if (!this.flush()) {
      this.document = currentDocument
      this.comments = currentComments
      return null
    }
    return target
  }
  recover = () => {
    try {
      const raw = this.storage.read(STORAGE_KEY)
      if (raw !== null) this.storage.write(`${STORAGE_KEY}:backup:${crypto.randomUUID()}`, raw)
      this.baseline = raw
      this.savedFingerprint = null
      this.publish({ status: 'dirty', error: null, recoveryRequired: false })
      this.save()
    } catch {
      this.publish({ status: 'error', error: 'The backup could not be stored. Original data is untouched; free device storage or allow local storage, then retry.', recoveryRequired: true })
    }
  }
}

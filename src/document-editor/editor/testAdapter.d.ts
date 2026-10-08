import type { Editor } from '@tiptap/core'
declare global {
  interface Window { __phase2Test?: { saveDelay?: number; editor?: Editor; explainFailures?: number } }
}

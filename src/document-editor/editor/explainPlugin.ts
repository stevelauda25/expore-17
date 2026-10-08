import { Extension, type Editor } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection, type SelectionBookmark } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { closeHistory } from '@tiptap/pm/history'
import type { Node } from '@tiptap/pm/model'
import { findMatches, getSelectionContext, restoreSelection, type SelectionContext } from './plugins'
import assetStyles from '../components/SourceAsset.module.css'
import paperStyles from '../components/DocumentPaper.module.css'

export const clauses = [
  { text: 'investment', badge: 'investment' },
  { text: 'experience for your customers', badge: 'experience' },
  { text: 'reorganize the content structure', badge: 'structure' },
] as const
interface ClauseRange { from: number; to: number; index: number }
export interface ExplainSource { bookmark: SelectionBookmark; context: SelectionContext; stale: boolean }
interface ExplainDocumentState { enabled: boolean; clauses: ClauseRange[]; source: ExplainSource | null }
export const explainKey = new PluginKey<ExplainDocumentState>('explain')
export function findExplainClauses(doc: Node): ClauseRange[] {
  return clauses.flatMap((clause, index) => {
    const range = findMatches(doc, clause.text)[0]
    return range ? [{ ...range, index }] : []
  })
}
export function createExplainPlugin() {
  return new Plugin<ExplainDocumentState>({
    key: explainKey,
    state: {
      init: (_, state): ExplainDocumentState => ({ enabled: false, source: null, clauses: findExplainClauses(state.doc) }),
      apply(tr, old) {
        const meta = tr.getMeta(explainKey) as Partial<ExplainDocumentState> | undefined
        const mapped = tr.docChanged ? old.clauses.flatMap(range => {
          const from = tr.mapping.map(range.from, 1), to = tr.mapping.map(range.to, -1)
          return from < to && tr.doc.textBetween(from, to) === clauses[range.index].text ? [{ ...range, from, to }] : []
        }) : old.clauses
        let source = old.source
        if (source && tr.docChanged) {
          const previous = source.bookmark.resolve(tr.before)
          // Include insertions at either source boundary when checking/regenerating.
          const bookmark = TextSelection.between(tr.doc.resolve(tr.mapping.map(previous.from, -1)), tr.doc.resolve(tr.mapping.map(previous.to, 1))).getBookmark()
          const range = bookmark.resolve(tr.doc)
          source = { ...source, bookmark, stale: source.stale || range.empty || tr.doc.textBetween(range.from, range.to, ' ') !== source.context.text }
        }
        return { ...old, clauses: mapped, source, ...meta }
      },
    },
    props: {
      decorations(state) {
        const model = explainKey.getState(state)!
        if (!model.enabled) return DecorationSet.empty
        return DecorationSet.create(state.doc, model.clauses.flatMap(range => {
          const clause = clauses[range.index]
          return [
            Decoration.widget(range.from, () => {
              const button = document.createElement('button')
              button.className = assetStyles.badge
              button.dataset.badge = clause.badge
              button.dataset.clauseMarker = String(range.index)
              button.type = 'button'
              button.setAttribute('aria-label', `Explain ${clause.text}`)
              button.setAttribute('aria-haspopup', 'dialog')
              const img = document.createElement('img')
              img.src = `/assets/document-editor/badge-${clause.badge}.png`
              img.alt = ''; img.draggable = false
              button.append(img)
              button.addEventListener('mousedown', event => event.preventDefault())
              return button
            }, { side: -1, key: clause.badge, stopEvent: () => true, ignoreSelection: true }),
            Decoration.inline(range.from, range.to, { class: paperStyles.clause, 'data-clause-text': String(range.index) }),
          ]
        }))
      },
    },
  })
}
export const ExplainExtension = Extension.create({
  name: 'explain',
  addProseMirrorPlugins: () => [createExplainPlugin()],
})

/** Capture only through the shared selection API; the plugin maps this pinned source independently. */
export function pinExplainSource(editor: Editor) {
  const context = getSelectionContext(editor)
  if (!context?.text.trim()) return null
  const source: ExplainSource = { context, bookmark: editor.state.selection.getBookmark(), stale: false }
  editor.view.dispatch(editor.state.tr.setMeta(explainKey, { source }))
  return context
}

export function refreshExplainSource(editor: Editor) {
  const source = explainKey.getState(editor.state)?.source
  if (!source) return null
  editor.view.dispatch(editor.state.tr.setSelection(source.bookmark.resolve(editor.state.doc)))
  return pinExplainSource(editor)
}

/** Verify at commit time, then replace as a single document-changing history event. */
export function applyExplainRewrite(editor: Editor, context: SelectionContext, replacement: string) {
  const source = explainKey.getState(editor.state)?.source
  if (!source || source.stale || source.context.version !== context.version || source.context.text !== context.text) return false
  const range = source.bookmark.resolve(editor.state.doc)
  if (range.empty || editor.state.doc.textBetween(range.from, range.to, ' ') !== context.text) return false
  editor.view.dispatch(editor.state.tr.setSelection(range))
  restoreSelection(editor)
  const tr = closeHistory(editor.state.tr.insertText(replacement, range.from, range.to))
  tr.setSelection(TextSelection.create(tr.doc, range.from, range.from + replacement.length))
  tr.setMeta(explainKey, { source: null })
  editor.view.dispatch(tr)
  // Isolate subsequent typing too; this metadata-only transaction creates no undo entry.
  editor.view.dispatch(closeHistory(editor.state.tr))
  return true
}

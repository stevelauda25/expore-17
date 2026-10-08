import { Extension, type Editor } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection, type SelectionBookmark } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'

export interface SelectionContext { from: number; to: number; text: string; version: number }
interface SelectionState { bookmark: SelectionBookmark; version: number; dismissed: boolean }
export const selectionKey = new PluginKey<SelectionState>('selectionContext')
export const SelectionContextExtension = Extension.create({
  name: 'selectionContext',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: selectionKey,
      state: {
        init: (_, state) => ({ bookmark: state.selection.getBookmark(), version: 0, dismissed: false }),
        apply(tr, previous) {
          return {
            bookmark: tr.selectionSet ? tr.selection.getBookmark() : previous.bookmark.map(tr.mapping),
            version: previous.version + Number(tr.docChanged),
            dismissed: tr.getMeta(selectionKey) === 'dismiss' || (!tr.selectionSet && !tr.docChanged && previous.dismissed),
          }
        },
      },
      props: {
        handleKeyDown(view, event) {
          const selection = view.state.selection
          if (!(selection instanceof TextSelection) || selection.empty || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return false
          // Commit caret collapse to the editor immediately. A native-only
          // collapse can race ProseMirror's deferred focus-selection sync after
          // returning from a floating surface.
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, event.key === 'ArrowLeft' ? selection.from : selection.to)))
          return true
        },
        decorations(state) {
          const selection = selectionKey.getState(state)!.bookmark.resolve(state.doc)
          return selection.empty ? DecorationSet.empty : DecorationSet.create(state.doc, [
            Decoration.inline(selection.from, selection.to, { class: 'preserved-selection' }),
            Decoration.inline(selection.from, Math.min(selection.from + 1, selection.to), { class: 'selection-start' }),
            Decoration.inline(Math.max(selection.from, selection.to - 1), selection.to, { class: 'selection-end' }),
          ])
        },
      },
    })]
  },
})
export function getSelectionContext(editor: Editor): SelectionContext | null {
  const stored = selectionKey.getState(editor.state)!
  const selection = stored.bookmark.resolve(editor.state.doc)
  return selection.empty ? null : { from: selection.from, to: selection.to, text: editor.state.doc.textBetween(selection.from, selection.to, ' '), version: stored.version }
}
export function restoreSelection(editor: Editor) {
  const bookmark = selectionKey.getState(editor.state)!.bookmark
  editor.view.dispatch(editor.state.tr.setSelection(bookmark.resolve(editor.state.doc)))
  editor.view.focus()
}

export interface SearchMatch { from: number; to: number }
export interface SearchState { query: string; matches: SearchMatch[]; index: number }
export const searchKey = new PluginKey<SearchState>('documentSearch')
/** Search each textblock as one string, so matches cross formatting boundaries. */
export function findMatches(doc: Node, query: string): SearchMatch[] {
  if (!query) return []
  const matches: SearchMatch[] = []
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return
    const text = node.textBetween(0, node.content.size, '', '\ufffc')
    // An escaped Unicode regexp preserves original UTF-16 positions even for İ.
    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu')
    for (const match of text.matchAll(pattern)) matches.push({ from: pos + 1 + match.index, to: pos + 1 + match.index + match[0].length })
    return false
  })
  return matches
}
export const DocumentSearch = Extension.create({
  name: 'documentSearch',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: searchKey,
      state: {
        init: (): SearchState => ({ query: '', matches: [], index: 0 }),
        apply(tr, old) {
          const meta = tr.getMeta(searchKey) as Partial<SearchState> | undefined
          if (!meta && !tr.docChanged) return old
          const query = meta?.query ?? old.query
          const matches = findMatches(tr.doc, query)
          const index = matches.length ? ((meta?.index ?? (query === old.query ? old.index : 0)) + matches.length) % matches.length : 0
          return { query, matches, index }
        },
      },
      props: {
        decorations(state) {
          const search = searchKey.getState(state)!
          return DecorationSet.create(state.doc, search.matches.map((match, i) => Decoration.inline(match.from, match.to, { class: i === search.index ? 'search-match search-current' : 'search-match' })))
        },
      },
    })]
  },
})

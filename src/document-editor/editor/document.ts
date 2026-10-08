import { Extension, getSchema, type JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Plugin } from '@tiptap/pm/state'
import { proposal, sampleSections } from '../content/proposal'

export const DocumentAttributes = Extension.create({
  name: 'documentAttributes',
  addGlobalAttributes() {
    return [
      { types: ['heading'], attributes: { id: { default: null, parseHTML: el => el.id || null, renderHTML: attrs => attrs.id ? { id: attrs.id } : {} } } },
      { types: ['paragraph'], attributes: { role: { default: null, parseHTML: el => el.dataset.role || null, renderHTML: attrs => attrs.role === 'date' ? { 'data-role': 'date' } : {} } } },
    ]
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      appendTransaction(transactions, _old, state) {
        if (!transactions.some(tr => tr.docChanged)) return null
        const tr = state.tr, seen = new Set<string>()
        state.doc.descendants((node, pos) => {
          if (node.type.name !== 'heading') return
          let id = node.attrs.id as string | null
          if (!id || seen.has(id)) {
            id = `section-${crypto.randomUUID()}`
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, id })
          }
          seen.add(id)
        })
        return tr.docChanged ? tr : null
      },
    })]
  },
})

export const documentExtensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, trailingNode: false }),
  TextStyle, Color, Highlight.configure({ multicolor: true }), DocumentAttributes,
]
const paragraph = (text: string, attrs?: Record<string, unknown>): JSONContent => ({ type: 'paragraph', attrs, content: [{ type: 'text', text }] })
const heading = (text: string, id: string, level = 2): JSONContent => ({ type: 'heading', attrs: { level, id }, content: [{ type: 'text', text }] })
export const initialDocument: JSONContent = {
  type: 'doc', content: [
    heading(proposal.title, 'document-title', 1),
    paragraph(proposal.date, { role: 'date' }), paragraph(proposal.greeting), paragraph(proposal.introduction),
    heading('Executive Summary', 'executive-summary'), paragraph(proposal.summary),
    heading('Project Background', 'project-background'), paragraph(proposal.background),
    heading('Objectives', 'objectives'),
    { type: 'bulletList', content: proposal.objectives.map(text => ({ type: 'listItem', content: [paragraph(text)] })) },
    ...sampleSections.flatMap(section => [heading(section.title, section.id), paragraph(section.text)]),
  ],
}

const schema = getSchema(documentExtensions)
/** Reject unknown/invalid nodes rather than letting the editor silently drop saved content. */
export function validateDocument(value: unknown): asserts value is JSONContent {
  if (!value || typeof value !== 'object' || (value as JSONContent).type !== 'doc') throw new Error('Invalid document')
  const node = schema.nodeFromJSON(value)
  node.check()
}

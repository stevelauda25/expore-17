import { expect, it } from 'vitest'
import { getSchema } from '@tiptap/core'
import { documentExtensions } from './document'
import { findMatches } from './plugins'
const schema = getSchema(documentExtensions)
it('finds literal case-insensitive matches across text marks without joining paragraphs', () => {
  const node = schema.nodeFromJSON({ type: 'doc', content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Acme ' }, { type: 'text', text: 'Studio', marks: [{ type: 'bold' }] }, { type: 'text', text: ' [a].' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Next' }] },
  ] })
  expect(findMatches(node, 'ACME studio')).toEqual([{ from: 1, to: 12 }])
  expect(findMatches(node, '[a].')).toEqual([{ from: 13, to: 17 }])
  expect(findMatches(node, '[a].Next')).toEqual([])
  expect(findMatches(node, '')).toEqual([])
})
it('keeps UTF-16 positions accurate after Unicode casing and hard breaks', () => {
  const node = schema.nodeFromJSON({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'İx 😀 ' }, { type: 'hardBreak' }, { type: 'text', text: 'Target' }] }] })
  expect(findMatches(node, 'target')).toEqual([{ from: 8, to: 14 }])
})

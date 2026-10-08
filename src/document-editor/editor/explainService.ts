import { proposal, sampleSections } from '../content/proposal'
import type { SelectionContext } from './plugins'

export type ExplainAction = 'Summary' | 'Key points' | 'Simplify' | 'Rewrite' | 'Ask a question'
export interface ExplainRequest { action: ExplainAction; selection: SelectionContext; question?: string; signal: AbortSignal }
export interface ExplainResult { action: ExplainAction; text?: string; points?: string[]; replacement?: string }
export interface ExplainAdapter { shouldFail?: () => boolean }
const tailored = new Map<string, string>([
  [proposal.summary, 'Acme Studio will redesign Bloom’s website to make it modern, easy to use, and focused on conversions. The site will communicate Bloom’s value, support growth, and be easier to manage.'],
  [proposal.background, 'Bloom has grown, but its website no longer reflects its products. The project will update the design, organize the content, and make the site easier to use.'],
  [proposal.introduction, 'This proposal describes your website redesign goals, approach, timeline, and investment. The project aims to strengthen your brand and improve the customer experience.'],
  ['investment', 'The resources or money put into the project. This selection does not specify an amount.'],
  ['experience for your customers', 'How customers feel and interact when they use your website.'],
  ['reorganize the content structure', 'Arrange the website’s information so it is easier to find and understand.'],
])
const sentences = (text: string) => text.match(/[^.!?]+(?:[.!?]+|$)/g)?.map(s => s.trim()).filter(Boolean) ?? []
function simplify(text: string) {
  return text.replace(/\bcomprehensive\b/gi, 'complete').replace(/\butilize\b/gi, 'use').replace(/\bfacilitate\b/gi, 'help').replace(/\bintuitive\b/gi, 'easy to use').replace(/\bconversion-focused\b/gi, 'focused on sign-ups').replace(/\bsignificantly\b/gi, 'a lot').replace(/\bin order to\b/gi, 'to').replace(/;\s*/g, '. ')
}
function concise(text: string) {
  return simplify(text).replace(/\b(?:really|very|basically|essentially)\s+/gi, '').replace(/\bat this point in time\b/gi, 'now').replace(/\bdue to the fact that\b/gi, 'because')
}
export function generateExplainResult({ action, selection, question = '' }: Omit<ExplainRequest, 'signal'>): ExplainResult {
  const text = selection.text.trim(), parts = sentences(text)
  const summary = tailored.get(text) ?? parts.slice(0, 2).join(' ')
  if (action === 'Key points') return { action, points: [...new Set(parts)].slice(0, 5) }
  if (action === 'Summary') return { action, text: summary }
  if (action === 'Simplify') return { action, text: tailored.get(text) ?? simplify(text) }
  if (action === 'Rewrite') {
    // Definitions help Explain, but must never be inserted as replacements for a clause.
    const replacement = text === proposal.summary ? 'Acme Studio will redesign Bloom’s website to communicate its value, support growth, improve conversions, and make the site easier to use and manage.'
      : text === proposal.background ? 'Bloom’s website needs to reflect its growth and product quality through a refreshed identity, clearer content, and a better user experience.'
        : text === proposal.introduction ? 'This proposal sets out your website redesign goals, approach, timeline, and investment to strengthen your brand and improve the customer experience.' : concise(text)
    return { action, replacement, text: replacement }
  }
  const q = question.toLowerCase()
  if (/^(what does this mean for the project\??|what should i focus on here\??|what (does this mean|is this about)\??)$/.test(q.trim())) return { action, text: summary }
  const cost = /\b(cost|budget|price|investment|how much)\b/.test(q)
  const timing = /\b(when|date|deadline|timeline|how long)\b/.test(q)
  if (cost || timing) {
    const sample = sampleSections.find(s => s.id === (cost ? 'budget' : 'timeline'))!
    return { action, text: text.includes(sample.text) ? sample.text : 'The selected passage does not supply the answer to that question.' }
  }
  if (/\b(goal|aim|purpose|improve|focus|why)\b/.test(q) && /\b(goal|aim|improve|redesign|growth)\b/i.test(text)) return { action, text: summary }
  return { action, text: 'The selected passage does not supply the answer to that question.' }
}

/** No network or random failures. The adapter permits reproducible error/retry journeys. */
export function requestExplanation(request: ExplainRequest, adapter: ExplainAdapter = {}): Promise<ExplainResult> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Request cancelled', 'AbortError')) }
    const timer = setTimeout(() => {
      request.signal.removeEventListener('abort', abort)
      if (adapter.shouldFail?.()) reject(new Error('The prototype response could not be generated. Please try again.'))
      else resolve(generateExplainResult(request))
    }, 600)
    if (request.signal.aborted) abort()
    else request.signal.addEventListener('abort', abort, { once: true })
  })
}

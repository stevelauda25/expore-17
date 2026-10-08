import { Emblem } from './Emblem'
import { Icon } from './SourceAsset'
import type { ExplainAction } from '../editor/explainService'
import styles from './ExplainMenu.module.css'

const actions = [
  { name: 'Summary', description: 'Get a short, plan-language summary', icon: 'summary' },
  { name: 'Key points', description: 'See the main ideas in bullet points', icon: 'key-points' },
  { name: 'Simplify', description: 'Rewrite in simpler, easier-to-understand', icon: 'simplify' },
  { name: 'Rewrite', description: 'Make it more concise, or adjust the tone', icon: 'rewrite' },
  { name: 'Ask a question', description: 'Ask anything about this text', icon: 'question' },
] as const
const suggestions: { text: string; action: ExplainAction }[] = [
  { text: 'Explain this in simpler terms', action: 'Simplify' },
  { text: 'What are the key points?', action: 'Key points' },
  { text: 'Rewrite this to be more concise', action: 'Rewrite' },
  { text: 'What does this mean for the project?', action: 'Ask a question' },
  { text: 'What should I focus on here?', action: 'Ask a question' },
]

/** Shared source presentation. Omitting onAction keeps the DEV fixture inert. */
export function ExplainMenuContent({ onAction }: { onAction?: (action: ExplainAction, question?: string) => void }) {
  return <>
    <header className={styles.popoverHeader}><Emblem explain /><div><h2>Explain this</h2><p>Get a clear, concise explanation of the selected text. Summarize, or rewrite it instantly.</p></div></header>
    <div className={styles.actions}>{actions.map(action => <button className={styles.action} key={action.name} aria-disabled={onAction ? undefined : true} onClick={() => onAction?.(action.name)}><span className={styles.actionIcon}><Icon name={action.icon} /></span><span><span className={styles.actionName}>{action.name}</span><span className={styles.description}>{action.description}</span></span></button>)}</div>
    <div className={styles.suggestions}><p>Try asking things like:</p><div>{suggestions.map(({ text, action }) => <button key={text} aria-disabled={onAction ? undefined : true} onClick={() => onAction?.(action, action === 'Ask a question' ? text : undefined)}>{text}</button>)}</div></div>
  </>
}

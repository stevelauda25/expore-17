import styles from './SourceAsset.module.css'

export type IconName = 'chevron' | 'search' | 'outline' | 'home' | 'document' | 'scan' | 'calendar' | 'library' | 'settings' | 'send' | 'document-title' | 'saving-track' | 'saving-arc' | 'tab-line' | 'close-panel' | 'edit' | 'close-banner' | 'toolbar-divider' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight' | 'summary' | 'key-points' | 'simplify' | 'rewrite' | 'question'

/** SVG dimensions come from the unmodified Figma exports. */
export function Icon({ name }: { name: IconName }) {
  return <img className={styles.icon} src={`/assets/document-editor/${name}.svg`} alt="" draggable={false} />
}

export function Orb({ size = 14 }: { size?: 14 | 20 }) {
  return <span className={size === 14 ? styles.orb14 : styles.orb20} aria-hidden="true"><img src={`/assets/document-editor/orb-${size}.png`} alt="" draggable={false} /></span>
}

export function ClauseBadge({ name }: { name: 'investment' | 'experience' | 'structure' }) {
  return <span className={styles.badge} data-badge={name} aria-hidden="true"><img src={`/assets/document-editor/badge-${name}.png`} alt="" draggable={false} /></span>
}

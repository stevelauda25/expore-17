import { Icon, Orb } from './SourceAsset'
import styles from './Emblem.module.css'

export function Emblem({ explain = false }: { explain?: boolean }) {
  return <div className={`${styles.emblem} ${explain ? styles.explain : ''}`} aria-hidden="true">
    <span className={styles.ringOuter} /><span className={styles.ringMiddle} /><span className={styles.ringInner} />
    <div className={styles.disk}>{explain ? <Orb size={20} /> : <Icon name="send" />}</div>
  </div>
}

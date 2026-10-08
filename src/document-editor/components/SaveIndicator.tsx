import { motion, useReducedMotion } from 'motion/react'
import styles from '../App.module.css'

export function SaveIndicator() {
  const reduced = useReducedMotion()
  const pathAnimation = (times: number[]) => reduced ? {} : {
    initial: { strokeDasharray: '0 1', strokeDashoffset: 0 },
    animate: { strokeDasharray: ['0 1', '1 1', '1 1', '1 1'] },
    transition: { duration: 2, ease: 'linear' as const, times, repeat: Infinity },
  }
  return <span className={styles.savingIcon} data-testid="saving-indicator" data-reduced-motion={!!reduced} aria-hidden="true">
    <svg width="11.6667" height="11.6667" viewBox="0 0 11.6667 11.6667" fill="none">
      <motion.path pathLength={1} {...pathAnimation([0, .6, .75, 1])} opacity=".4" d="M5.83333 0.583333C8.7325 0.583333 11.0833 2.93417 11.0833 5.83333C11.0833 8.7325 8.7325 11.0833 5.83333 11.0833C2.93417 11.0833 0.583333 8.7325 0.583333 5.83333C0.583333 2.93417 2.93417 0.583333 5.83333 0.583333Z" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" stroke="#1687EF" />
    </svg>
    <motion.svg className={styles.savingArc} width="6.41667" height="6.41667" viewBox="0 0 6.41667 6.41667" fill="none" style={{ overflow: 'visible', transformOrigin: '0% 100%' }}
      {...(reduced ? {} : { initial: { rotate: 0 }, animate: { rotate: [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336, 360, 360] }, transition: { rotate: { duration: 2, times: [0, .05, .1, .15, .2, .25, .3, .35, .4, .45, .5, .55, .6, .65, .7, .75, 1], ease: 'linear', repeat: Infinity } } })}>
      <motion.path pathLength={1} {...pathAnimation([0, .15, .75, 1])} d="M0.583333 0.583333C3.4825 0.583333 5.83333 2.93417 5.83333 5.83333" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" stroke="#1687EF" />
    </motion.svg>
  </span>
}

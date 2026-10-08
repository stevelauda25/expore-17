import { createContext, useContext } from 'react'

export const EditorEnvironment = createContext<{ active: boolean; portalRoot: HTMLElement } | null>(null)
export function useEditorEnvironment() {
  const environment = useContext(EditorEnvironment)
  if (!environment) throw new Error('Missing editor environment')
  return environment
}
/** Reserve the playground switcher on short screens, leaving source geometry at 1060px. */
export function editorFloatingPadding() {
  return { top: 12, left: 12, right: 12, bottom: window.innerHeight <= 500 ? 70 : window.innerHeight < 1032 ? 102 : 12 }
}

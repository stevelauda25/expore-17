import { createContext, useContext } from 'react'

export const EditorEnvironment = createContext<{ active: boolean; portalRoot: HTMLElement } | null>(null)
export function useEditorEnvironment() {
  const environment = useContext(EditorEnvironment)
  if (!environment) throw new Error('Missing editor environment')
  return environment
}
/** Keep floating surfaces within the viewport; navigation is an independent overlay. */
export function editorFloatingPadding() {
  return { top: 12, left: 12, right: 12, bottom: 12 }
}

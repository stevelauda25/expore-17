import { createContext, useContext } from 'react'

export type ToolTab = 'Explain' | 'Comments' | 'History'
export interface UIState { panelOpen: boolean; bannerOpen: boolean; tab: ToolTab; outlineOpen: boolean; explainMode: boolean; activeHeading: string; notice: string | null }
export type UIAction = { type: 'tab'; tab: ToolTab } | { type: 'closePanel' } | { type: 'dismissBanner' } | { type: 'openExplain' } | { type: 'toggleOutline' } | { type: 'toggleExplain' } | { type: 'activeHeading'; id: string } | { type: 'notice'; text: string | null }
export const initialUI: UIState = { panelOpen: true, bannerOpen: true, tab: 'Explain', outlineOpen: true, explainMode: false, activeHeading: 'executive-summary', notice: null }
export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'tab': return { ...state, tab: action.tab, panelOpen: true }
    case 'closePanel': return { ...state, panelOpen: false }
    case 'dismissBanner': return { ...state, bannerOpen: false }
    case 'openExplain': return { ...state, panelOpen: true, tab: 'Explain', explainMode: true }
    case 'toggleOutline': return { ...state, outlineOpen: !state.outlineOpen }
    case 'toggleExplain': return { ...state, explainMode: !state.explainMode }
    case 'activeHeading': return state.activeHeading === action.id ? state : { ...state, activeHeading: action.id }
    case 'notice': return { ...state, notice: action.text }
  }
}
export const UIContext = createContext<{ state: UIState; dispatch: React.Dispatch<UIAction> } | null>(null)
export function useUI() {
  const context = useContext(UIContext)
  if (!context) throw new Error('Missing editor UI context')
  return context
}

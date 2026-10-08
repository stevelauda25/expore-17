import { useState } from 'react'
import EditorApp from './editor/EditorApp'
import { EditorEnvironment } from './EditorEnvironment'
import './tokens.css'

export default function DocumentEditorDemo({ active }: { active: boolean }) {
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)
  return <div className="document-editor-scope" data-editor-active={active}>
    <div ref={setPortalRoot} data-editor-portals hidden={!active} />
    {portalRoot && <EditorEnvironment.Provider value={{ active, portalRoot }}><EditorApp /></EditorEnvironment.Provider>}
  </div>
}

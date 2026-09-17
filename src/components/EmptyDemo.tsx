interface EmptyDemoProps {
  id: 'date-picker' | 'profile'
  active: boolean
}

export function EmptyDemo({ id, active }: EmptyDemoProps) {
  return (
    <section
      id={`exploration-panel-${id}`}
      className="exploration-panel empty-demo"
      role="tabpanel"
      aria-labelledby={`exploration-tab-${id}`}
      hidden={!active}
      tabIndex={0}
    />
  )
}

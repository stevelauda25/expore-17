interface UtilityLinkProps {
  id: string
  label: string
  onNavigate: () => void
}

export function UtilityLink({ id, label, onNavigate }: UtilityLinkProps) {
  return (
    <a className="utility-link" href={`#${id}`} onClick={(event) => {
      event.preventDefault()
      onNavigate()
    }}>
      <img src={`/assets/figma/${id}.svg`} alt="" width="14" height="14" />
      <span>{label}</span>
    </a>
  )
}

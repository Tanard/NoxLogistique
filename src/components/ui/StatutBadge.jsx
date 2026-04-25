import { STATUTS } from '../../constants'

export function StatutBadge({ statut }) {
  const s = STATUTS.find(x => x.label === statut)
  if (!s) return <span>{statut}</span>
  return (
    <span
      className="badge"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

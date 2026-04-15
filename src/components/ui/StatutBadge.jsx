import { STATUTS } from '../../constants'

export function StatutBadge({ statut }) {
  const s = STATUTS.find(x => x.label === statut)
  if (!s) return <span>{statut}</span>
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

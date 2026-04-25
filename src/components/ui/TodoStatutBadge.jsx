import { TODO_STATUTS } from '../../constants'

export function TodoStatutBadge({ statut }) {
  const s = TODO_STATUTS.find(x => x.label === statut)
  if (!s) return (
    <span className="badge bg-gray-100 text-gray-500 border border-gray-200">
      {statut ?? '—'}
    </span>
  )
  return (
    <span
      className="badge"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

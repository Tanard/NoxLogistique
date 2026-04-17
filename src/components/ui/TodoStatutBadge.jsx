import { TODO_STATUTS } from '../../constants'

export function TodoStatutBadge({ statut }) {
  const s = TODO_STATUTS.find(x => x.label === statut)
  // #11 : fallback stylé pour statut inconnu (données corrompues, migration incomplète)
  if (!s) return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-gray-100 text-gray-500 border border-gray-200">
      {statut ?? '—'}
    </span>
  )
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

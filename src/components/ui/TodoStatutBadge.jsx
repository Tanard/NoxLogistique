import { TODO_STATUTS } from '../../constants'

export function TodoStatutBadge({ statut }) {
  const s = TODO_STATUTS.find(x => x.label === statut)
  if (!s) return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 whitespace-nowrap">
      <span style={{ backgroundColor: '#9CA3AF', width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
      {statut ?? '—'}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 whitespace-nowrap">
      <span style={{ backgroundColor: s.dot, width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

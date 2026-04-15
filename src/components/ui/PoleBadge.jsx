import { POLES } from '../../constants'

export function PoleBadge({ pole }) {
  const p = POLES.find(x => x.label === pole)
  if (!p) return <span>{pole}</span>
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: p.color }}
    >
      <p.icon size={13} />
      {p.label}
    </span>
  )
}

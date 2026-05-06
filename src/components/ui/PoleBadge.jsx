import { POLES } from '../../constants'

export function PoleBadge({ pole }) {
  const p = POLES.find(x => x.label === pole)
  if (!p) return <span>{pole}</span>
  return (
    <span
      className="badge gap-1.5"
      style={{ backgroundColor: p.color + '1A', color: p.color }}
    >
      <p.icon size={13} />
      {p.label}
    </span>
  )
}

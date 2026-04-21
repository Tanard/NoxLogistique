import { ROLE_CONFIG } from '../../constants'

export function RoleBadge({ role }) {
  const rc = ROLE_CONFIG[role] ?? ROLE_CONFIG.viewer
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}
    >
      {rc.label}
    </span>
  )
}

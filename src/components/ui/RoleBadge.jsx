import { ROLE_CONFIG } from '../../constants'

export function RoleBadge({ role }) {
  const rc = ROLE_CONFIG[role] ?? ROLE_CONFIG.viewer
  if (role === 'super_admin') {
    return <span className="badge border badge-super-admin">{rc.label}</span>
  }
  return (
    <span className="badge border" style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}>
      {rc.label}
    </span>
  )
}

import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Music,
  ShieldCheck,
  Truck,
  Settings,
  CheckSquare,
} from 'lucide-react'

export const COLORS = {
  sidebar: '#1E1B2E',
  card: '#3D2C5E',
  accent: '#7C3AED',
  bg: '#F8F7FC',
  textDark: '#2D2B3A',
  tableHeader: '#2D2650',
}

export const POLES = [
  { label: 'Bénévole', icon: Users, color: '#8B5CF6' },
  { label: 'Restauration', icon: UtensilsCrossed, color: '#F472B6' },
  { label: 'Artiste', icon: Music, color: '#FB923C' },
  { label: 'Sécurité', icon: ShieldCheck, color: '#34D399' },
  { label: 'Logistique', icon: Truck, color: '#60A5FA' },
]

export const STATUTS = [
  { label: 'En attente', bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  { label: 'Validé', bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
  { label: 'Annulé', bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
]

export const TODO_STATUTS = [
  { label: 'À faire',  bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  { label: 'En cours', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
  { label: 'Terminé',  bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
]

export const NAV_ITEMS = [
  { label: 'Administration',   icon: Settings,        id: 'admin',   adminOnly: true },
  { label: 'Liste des Besoins', icon: LayoutDashboard, id: 'general' },
  { label: 'Todo',             icon: CheckSquare,     id: 'todo' },
]

// A1 — ROLE_CONFIG déplacé ici depuis AdminPage.jsx pour éviter l'import circulaire
// (ModalUser importait depuis AdminPage, créant une dépendance cyclique)
export const ROLE_CONFIG = {
  admin:        { label: 'Admin',        bg: '#EF444420', text: '#EF4444', border: '#EF444460' },
  pole_manager: { label: 'Responsable',  bg: '#F9731620', text: '#EA580C', border: '#F9731660' },
  viewer:       { label: 'Viewer',       bg: '#22C55E20', text: '#16A34A', border: '#22C55E60' },
}

export const SORT_KEYS = {
  'Pôle': 'pole',
  'Date': 'date',
  'Désignation': 'designation',
  'Quantité': 'quantite',
  'Usage prévu': 'usage',
  'Statut': 'statut',
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function cycleTodoStatut(current) {
  const idx = TODO_STATUTS.findIndex(s => s.label === current)
  return TODO_STATUTS[(idx + 1) % TODO_STATUTS.length].label
}

import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Music,
  ShieldCheck,
  Truck,
  Settings,
  CheckSquare,
  Map,
} from 'lucide-react'

export const POLES = [
  { label: 'Bénévole', icon: Users, color: '#8B5CF6' },
  { label: 'Restauration', icon: UtensilsCrossed, color: '#F472B6' },
  { label: 'Artiste', icon: Music, color: '#FB923C' },
  { label: 'Sécurité', icon: ShieldCheck, color: '#34D399' },
  { label: 'Logistique', icon: Truck, color: '#60A5FA' },
]

export const STATUTS = [
  { label: 'En attente', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  { label: 'Validé', bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  { label: 'Annulé', bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
]

export const TODO_STATUTS = [
  { label: 'À faire',  bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  { label: 'En cours', bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' },
  { label: 'Terminé',  bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
]

export const NAV_ITEMS = [
  { label: 'Administration',    icon: Settings,        id: 'admin',   adminOnly: true },
  { label: 'Liste des Besoins', icon: LayoutDashboard, id: 'general' },
  { label: 'Todo',              icon: CheckSquare,     id: 'todo' },
  { label: 'Carte technique',   icon: Map,             id: 'map' },
]

export const MAP_ELEMENTS = [
  { id: 'water',       emoji: '💧', label: 'Point d\'eau',    color: '#3B82F6' },
  { id: 'electricity', emoji: '⚡', label: 'Élec.',           color: '#F59E0B' },
  { id: 'light',       emoji: '💡', label: 'Lumière',          color: '#FCD34D' },
  { id: 'toilet',      emoji: '🚽', label: 'Toilettes',        color: '#8B5CF6' },
  { id: 'generator',   emoji: '🔋', label: 'Groupe élec.',     color: '#EF4444' },
  { id: 'stage',       emoji: '🎪', label: 'Scène',            color: '#10B981' },
  { id: 'bar',         emoji: '🍺', label: 'Bar',              color: '#F97316' },
  { id: 'parking',     emoji: '🅿️', label: 'Parking',          color: '#6B7280' },
]

export const MAP_PATH_TYPES = [
  { id: 'water',       label: 'Eau',         color: '#3B82F6' },
  { id: 'electricity', label: 'Électricité', color: '#F59E0B' },
  { id: 'audio',       label: 'Son / Data',  color: '#8B5CF6' },
  { id: 'fence',       label: 'Clôture',     color: '#6B7280' },
]

// A1 — ROLE_CONFIG déplacé ici depuis AdminPage.jsx pour éviter l'import circulaire
// (ModalUser importait depuis AdminPage, créant une dépendance cyclique)
export const ROLE_CONFIG = {
  admin:        { label: 'Admin',        bg: '#7C3AED20', text: '#7C3AED', border: '#7C3AED60' },
  pole_manager: { label: 'Responsable',  bg: '#F9731620', text: '#EA580C', border: '#F9731660' },
  viewer:       { label: 'Viewer',       bg: '#64748B20', text: '#475569', border: '#64748B60' },
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

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    '[Supabase] Variables manquantes dans .env — copie .env.example vers .env et renseigne VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

export const DEFAULT_FESTIVAL_ID =
  import.meta.env.VITE_DEFAULT_FESTIVAL_ID ??
  '00000000-0000-0000-0000-000000000001'

/**
 * Convertit une ligne Supabase (snake_case) vers le format utilisé dans l'UI (camelCase).
 */
export function rowToBesoin(row) {
  return {
    id: row.id,
    festival_id: row.festival_id,
    pole: row.pole,
    zone: row.zone ?? '',
    date: row.date,
    designation: row.designation,
    quantite: row.quantite,
    prix: row.prix ?? '',
    caracteristique: row.caracteristique ?? '',
    usage: row.usage ?? '',
    statut: row.statut,
    longueur: row.longueur ?? '',
    largeur: row.largeur ?? '',
    hauteur: row.hauteur ?? '',
    electricite: row.electricite,
    electriciteDetail: row.electricite_detail ?? '',
    eau: row.eau,
    eauDetail: row.eau_detail ?? '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function rowToTodo(row) {
  return {
    id: row.id,
    festival_id: row.festival_id,
    titre: row.titre,
    description: row.description ?? '',
    assignee: row.assignee,
    statut: row.statut,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function todoToInsertRow(t, festivalId) {
  return {
    festival_id: festivalId,
    titre: t.titre?.trim(),
    description: t.description?.trim() || null,
    assignee: t.assignee?.trim(),
    statut: t.statut,
  }
}

export function todoToUpdateRow(t) {
  return {
    titre: t.titre?.trim(),
    description: t.description?.trim() || null,
    assignee: t.assignee?.trim(),
    statut: t.statut,
  }
}

/**
 * Convertit un objet UI (camelCase) vers une ligne Supabase (snake_case).
 */
export function besoinToRow(b, festivalId) {
  return {
    festival_id: festivalId,
    pole: b.pole,
    zone: b.zone?.trim() || null,
    date: b.date,
    designation: b.designation,
    quantite: Number(b.quantite) || 0,
    prix: b.prix !== '' && b.prix !== null && b.prix !== undefined ? Number(b.prix) : null,
    caracteristique: b.caracteristique?.trim() || null,
    usage: b.usage?.trim() || null,
    statut: b.statut,
    longueur: b.longueur || null,
    largeur: b.largeur || null,
    hauteur: b.hauteur || null,
    electricite: b.electricite ?? 'Non',
    electricite_detail: b.electriciteDetail?.trim() || null,
    eau: b.eau ?? 'Non',
    eau_detail: b.eauDetail?.trim() || null,
  }
}

export function rowToPlanningEvent(row) {
  return {
    id: row.id,
    festival_id: row.festival_id,
    title: row.title,
    notes: row.notes ?? '',
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    created_at: row.created_at,
  }
}

export function planningEventToRow(e, festivalId) {
  return {
    festival_id: festivalId,
    title: e.title?.trim(),
    notes: e.notes?.trim() || null,
    start_at: e.start instanceof Date ? e.start.toISOString() : e.start,
    end_at: e.end instanceof Date ? e.end.toISOString() : e.end,
  }
}

export function planningEventToUpdateRow(e) {
  return {
    title: e.title?.trim(),
    notes: e.notes?.trim() || null,
    start_at: e.start instanceof Date ? e.start.toISOString() : e.start,
    end_at: e.end instanceof Date ? e.end.toISOString() : e.end,
  }
}

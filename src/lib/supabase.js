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
    date: row.date,
    designation: row.designation,
    quantite: row.quantite,
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

/**
 * Convertit un objet UI (camelCase) vers une ligne Supabase (snake_case).
 */
export function besoinToRow(b, festivalId) {
  return {
    festival_id: festivalId,
    pole: b.pole,
    date: b.date,
    designation: b.designation,
    quantite: Number(b.quantite) || 0,
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

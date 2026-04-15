import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Gestion des utilisateurs (admin uniquement).
 *
 * - Charge tous les profils + leurs appartenances aux festivals
 * - Expose les opérations CRUD sur les memberships
 * - Délègue la création/suppression d'utilisateurs aux Edge Functions
 *   (opérations qui nécessitent la service_role key côté serveur)
 */
export function useUsers({ enabled = false }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Chargement ────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)

    // 1. Tous les profils (email visible grâce à la migration 002)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: true })

    if (profilesError) {
      console.error('[useUsers] profiles error:', profilesError)
      setError(profilesError)
      setLoading(false)
      return
    }

    // 2. Tous les festival_members avec info festival
    //    (visible grâce à la politique RLS is_any_admin())
    const { data: members, error: membersError } = await supabase
      .from('festival_members')
      .select('user_id, role, festival_id, festivals(id, name)')

    if (membersError) {
      console.error('[useUsers] members error:', membersError)
      setError(membersError)
      setLoading(false)
      return
    }

    // 3. Regroupe les memberships par user_id
    const membersByUser = {}
    ;(members ?? []).forEach(m => {
      if (!membersByUser[m.user_id]) membersByUser[m.user_id] = []
      membersByUser[m.user_id].push({
        festivalId:   m.festival_id,
        festivalName: m.festivals?.name ?? '—',
        role:         m.role,
      })
    })

    // 4. Assemble la liste finale
    const list = (profiles ?? []).map(p => ({
      id:          p.id,
      email:       p.email       ?? '—',
      fullName:    p.full_name   ?? '—',
      createdAt:   p.created_at,
      memberships: membersByUser[p.id] ?? [],
    }))

    setUsers(list)
    setLoading(false)
  }, [enabled])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // ── Opérations membership (client → RLS admin) ────────────────────────────

  const updateRole = useCallback(async (userId, festivalId, newRole) => {
    const { error } = await supabase
      .from('festival_members')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('festival_id', festivalId)
    if (!error) await loadUsers()
    return { error }
  }, [loadUsers])

  const addMembership = useCallback(async (userId, festivalId, role = 'viewer') => {
    const { error } = await supabase
      .from('festival_members')
      .insert({ user_id: userId, festival_id: festivalId, role })
    if (!error) await loadUsers()
    return { error }
  }, [loadUsers])

  const removeMembership = useCallback(async (userId, festivalId) => {
    const { error } = await supabase
      .from('festival_members')
      .delete()
      .eq('user_id', userId)
      .eq('festival_id', festivalId)
    if (!error) await loadUsers()
    return { error }
  }, [loadUsers])

  // ── Opérations auth (client → Edge Function → service_role) ───────────────

  /** Crée un utilisateur via la Edge Function admin-create-user */
  const createUser = useCallback(async ({ email, password, fullName }) => {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, fullName },
    })
    if (!error) await loadUsers()
    return { data, error }
  }, [loadUsers])

  /** Supprime un utilisateur via la Edge Function admin-delete-user */
  const deleteUser = useCallback(async (userId) => {
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId },
    })
    if (!error) await loadUsers()
    return { data, error }
  }, [loadUsers])

  /** Envoie un lien de reset mot de passe à l'email de l'utilisateur */
  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }, [])

  return {
    users,
    loading,
    error,
    reload: loadUsers,
    updateRole,
    addMembership,
    removeMembership,
    createUser,
    deleteUser,
    sendPasswordReset,
  }
}

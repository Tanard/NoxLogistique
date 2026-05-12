import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Gestion du festival actif.
 *
 * - Récupère tous les festivals accessibles à l'utilisateur
 * - Persiste le festival sélectionné dans localStorage
 * - Expose selectFestival(id) pour changer de festival
 */
export function useFestival(userId) {
  const [festivals, setFestivals]               = useState([])
  const [selectedId, setSelectedId]             = useState(null)
  const [loadingFestivals, setLoadingFestivals] = useState(false)

  // Fix #10 — ref pour annuler les appels obsolètes en cas de changement rapide de userId
  const currentCallRef = useRef(0)

  // Charge la liste des festivals accessibles à l'utilisateur
  const loadFestivals = useCallback(async (uid) => {
    if (!uid) { setFestivals([]); setSelectedId(null); setLoadingFestivals(false); return }
    setLoadingFestivals(true)

    // Fix #10 — on identifie cet appel ; tout appel plus récent l'annule
    const callId = ++currentCallRef.current

    // Super_admin : accès global à tous les festivals
    const { data: superAdminRow } = await supabase
      .from('festival_members')
      .select('id')
      .eq('user_id', uid)
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle()

    let list = []

    if (superAdminRow) {
      const { data: allFestivals, error } = await supabase
        .from('festivals')
        .select('id, name, slug')
        .order('name', { ascending: true })
      if (callId !== currentCallRef.current) { setLoadingFestivals(false); return }
      if (!error) list = (allFestivals ?? []).map(f => ({ ...f, role: 'super_admin' }))
    } else {
      const { data, error } = await supabase
        .from('festival_members')
        .select('role, festivals(id, name, slug)')
        .eq('user_id', uid)
      if (callId !== currentCallRef.current) { setLoadingFestivals(false); return }
      if (error) { console.error('[useFestival] loadFestivals error:', error); setFestivals([]); setLoadingFestivals(false); return }
      list = (data ?? []).filter(d => d.festivals).map(d => ({ ...d.festivals, role: d.role }))
    }

    setFestivals(list)
    let saved = null
    try { saved = localStorage.getItem('logisticore_festival_id') } catch { /* localStorage indisponible */ }
    const match = list.find(f => f.id === saved)
    setSelectedId(match ? match.id : (list[0]?.id ?? null))
    setLoadingFestivals(false)
  }, [])

  useEffect(() => {
    loadFestivals(userId)
  }, [userId, loadFestivals])

  const selectFestival = useCallback((id) => {
    setSelectedId(id)
    // Fix #25 — localStorage entouré de try/catch
    try { localStorage.setItem('logisticore_festival_id', id) } catch { /* localStorage indisponible */ }
  }, [])

  const activeFestival = festivals.find(f => f.id === selectedId) ?? null

  return {
    festivals,
    activeFestival,
    selectedId,
    selectFestival,
    loadingFestivals,
    // Fix #11 — useCallback pour stabiliser la référence et éviter la stale closure
    reloadFestivals: useCallback(() => loadFestivals(userId), [userId, loadFestivals]),
  }
}

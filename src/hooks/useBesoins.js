import { useEffect, useState, useCallback } from 'react'
import { supabase, DEFAULT_FESTIVAL_ID, rowToBesoin, besoinToRow } from '../lib/supabase'

/**
 * Hook qui gère la liste des besoins avec sync temps réel.
 *
 * Retourne :
 *  - besoins         : liste actuelle (toujours synchronisée via Supabase Realtime)
 *  - loading         : chargement initial
 *  - error           : erreur éventuelle
 *  - addBesoin(b)    : création (optimistic via realtime)
 *  - updateBesoin(b) : modification
 *  - deleteBesoin(id): suppression
 *  - refetch()       : force un rechargement complet
 *
 * Le hook s'abonne à Supabase Realtime — toute modification faite par un autre
 * utilisateur sur le même festival apparaît automatiquement chez tous les clients.
 */
export function useBesoins({ enabled = true, festivalId = DEFAULT_FESTIVAL_ID } = {}) {
  const [besoins, setBesoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fix #8 — fetchAll retourne les données plutôt que de setter l'état directement,
  // pour éviter le setState après unmount.
  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('besoins')
      .select('*')
      .eq('festival_id', festivalId)
      .order('date', { ascending: false })

    if (error) return { error }
    return { data: (data ?? []).map(rowToBesoin) }
  }, [festivalId])

  // Chargement initial + abonnement realtime
  useEffect(() => {
    if (!enabled) {
      setBesoins([])
      setLoading(false)
      return
    }

    let mounted = true
    // Fix #9 — flag actif pour le handler realtime
    let active = true

    // Fix #8 — l'appelant (useEffect) décide quoi faire avec le résultat
    fetchAll().then(({ data, error }) => {
      if (!mounted) return
      if (error) setError(error)
      else { setBesoins(data); setError(null) }
    }).finally(() => { if (mounted) setLoading(false) })

    const channel = supabase
      .channel(`besoins:${festivalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'besoins',
          filter: `festival_id=eq.${festivalId}`,
        },
        (payload) => {
          // Fix #9 — vérifie le flag avant tout setState
          if (!active) return
          setBesoins((prev) => {
            if (payload.eventType === 'INSERT') {
              const newRow = rowToBesoin(payload.new)
              // Évite les doublons si l'insert local est plus rapide que l'event
              if (prev.find((b) => b.id === newRow.id)) return prev
              return [newRow, ...prev]
            }
            if (payload.eventType === 'UPDATE') {
              const updated = rowToBesoin(payload.new)
              return prev.map((b) => (b.id === updated.id ? updated : b))
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((b) => b.id !== payload.old.id)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [enabled, festivalId, fetchAll])

  const addBesoin = useCallback(
    async (b) => {
      const row = besoinToRow(b, festivalId)
      // Fix #17 — maybeSingle() au lieu de single() pour éviter l'erreur PGRST116
      const { data, error } = await supabase.from('besoins').insert(row).select().maybeSingle()
      if (error) {
        setError(error)
        return { error }
      }
      if (data === null) {
        const err = new Error('besoin introuvable après insertion')
        setError(err)
        return { error: err }
      }
      return { data: rowToBesoin(data) }
    },
    [festivalId]
  )

  const updateBesoin = useCallback(
    async (b) => {
      const row = besoinToRow(b, festivalId)
      // Fix #17 — maybeSingle() au lieu de single()
      const { data, error } = await supabase
        .from('besoins')
        .update(row)
        .eq('id', b.id)
        .select()
        .maybeSingle()
      if (error) {
        setError(error)
        return { error }
      }
      if (data === null) {
        const err = new Error('besoin introuvable après mise à jour')
        setError(err)
        return { error: err }
      }
      return { data: rowToBesoin(data) }
    },
    [festivalId]
  )

  const deleteBesoin = useCallback(async (id) => {
    const { error } = await supabase.from('besoins').delete().eq('id', id)
    if (error) setError(error)
    return { error }
  }, [])

  return {
    besoins,
    loading,
    error,
    addBesoin,
    updateBesoin,
    deleteBesoin,
    refetch: fetchAll,
  }
}

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useZones({ festivalId } = {}) {
  const [zones, setZones] = useState([])

  const fetchZones = useCallback(async () => {
    if (!festivalId) { setZones([]); return }
    const { data } = await supabase
      .from('zones')
      .select('id, nom, commentaire')
      .eq('festival_id', festivalId)
      .order('nom', { ascending: true })
    if (data) setZones(data)
  }, [festivalId])

  useEffect(() => { fetchZones() }, [fetchZones])

  const addZone = useCallback(async (nom, commentaire = '') => {
    if (!festivalId || !nom?.trim()) return { error: new Error('Nom requis') }
    const { error } = await supabase.from('zones').insert({
      festival_id: festivalId,
      nom: nom.trim(),
      commentaire: commentaire?.trim() || null,
    })
    if (!error) fetchZones()
    return { error }
  }, [festivalId, fetchZones])

  const updateZone = useCallback(async (id, nom, commentaire = '') => {
    if (!nom?.trim()) return { error: new Error('Nom requis') }
    const { error } = await supabase.from('zones').update({
      nom: nom.trim(),
      commentaire: commentaire?.trim() || null,
    }).eq('id', id)
    if (!error) fetchZones()
    return { error }
  }, [fetchZones])

  return { zones, addZone, updateZone }
}

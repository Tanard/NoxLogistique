import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFestivalMap({ enabled = true, festivalId } = {}) {
  const [mapData, setMapData] = useState(null)
  const [markers, setMarkers] = useState([])
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!festivalId) return

    let { data: map, error } = await supabase
      .from('festival_maps')
      .select('*')
      .eq('festival_id', festivalId)
      .maybeSingle()

    if (error) { console.error('[useFestivalMap] fetch:', error); return }

    if (!map) {
      const { data: created, error: createErr } = await supabase
        .from('festival_maps')
        .insert({ festival_id: festivalId })
        .select()
        .maybeSingle()
      if (createErr) { console.error('[useFestivalMap] create:', createErr); return }
      map = created
    }

    setMapData(map)

    const [{ data: markersData, error: markersErr }, { data: pathsData, error: pathsErr }] = await Promise.all([
      supabase.from('map_markers').select('*').eq('festival_map_id', map.id),
      supabase.from('map_paths').select('*').eq('festival_map_id', map.id),
    ])

    if (markersErr) console.error('[useFestivalMap] markers:', markersErr)
    if (pathsErr) console.error('[useFestivalMap] paths:', pathsErr)
    setMarkers(markersData ?? [])
    setPaths(pathsData ?? [])
  }, [festivalId])

  useEffect(() => {
    if (!enabled || !festivalId) {
      setMapData(null)
      setMarkers([])
      setPaths([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetchAll().finally(() => setLoading(false))
  }, [enabled, festivalId, fetchAll])

  const updateMapView = useCallback(async (center_lat, center_lng, zoom) => {
    if (!mapData?.id) return { error: new Error('no map') }
    const { data, error } = await supabase
      .from('festival_maps')
      .update({ center_lat, center_lng, zoom, updated_at: new Date().toISOString() })
      .eq('id', mapData.id)
      .select()
      .maybeSingle()
    if (!error && data) setMapData(data)
    return { error: error ?? null }
  }, [mapData?.id])

  const lockMap = useCallback(async () => {
    if (!mapData?.id) return { error: new Error('no map') }
    const { data, error } = await supabase
      .from('festival_maps')
      .update({ locked: true, updated_at: new Date().toISOString() })
      .eq('id', mapData.id)
      .select()
      .maybeSingle()
    if (!error && data) setMapData(data)
    return { error: error ?? null }
  }, [mapData?.id])

  const unlockMap = useCallback(async () => {
    if (!mapData?.id) return { error: new Error('no map') }
    const { data, error } = await supabase
      .from('festival_maps')
      .update({ locked: false, updated_at: new Date().toISOString() })
      .eq('id', mapData.id)
      .select()
      .maybeSingle()
    if (!error && data) setMapData(data)
    return { error: error ?? null }
  }, [mapData?.id])

  const addMarker = useCallback(async ({ type, lat, lng, label }) => {
    if (!mapData?.id) return { error: new Error('no map') }
    const { data, error } = await supabase
      .from('map_markers')
      .insert({ festival_map_id: mapData.id, type, lat, lng, label: label ?? null })
      .select()
      .maybeSingle()
    if (!error && data) setMarkers(prev => [...prev, data])
    return { data, error: error ?? null }
  }, [mapData?.id])

  const deleteMarker = useCallback(async (id) => {
    const { error } = await supabase.from('map_markers').delete().eq('id', id)
    if (!error) setMarkers(prev => prev.filter(m => m.id !== id))
    return { error: error ?? null }
  }, [])

  const addPath = useCallback(async ({ type, points, color, label }) => {
    if (!mapData?.id) return { error: new Error('no map') }
    const { data, error } = await supabase
      .from('map_paths')
      .insert({ festival_map_id: mapData.id, type, points, color, label: label ?? null })
      .select()
      .maybeSingle()
    if (!error && data) setPaths(prev => [...prev, data])
    return { data, error: error ?? null }
  }, [mapData?.id])

  const deletePath = useCallback(async (id) => {
    const { error } = await supabase.from('map_paths').delete().eq('id', id)
    if (!error) setPaths(prev => prev.filter(p => p.id !== id))
    return { error: error ?? null }
  }, [])

  useEffect(() => {
    if (!mapData?.id) return
    const channel = supabase
      .channel(`festival_map:${mapData.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'festival_maps', filter: `id=eq.${mapData.id}` }, (payload) => {
        setMapData(payload.new)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'map_markers', filter: `festival_map_id=eq.${mapData.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setMarkers(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        if (payload.eventType === 'UPDATE') setMarkers(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
        if (payload.eventType === 'DELETE') setMarkers(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'map_paths', filter: `festival_map_id=eq.${mapData.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setPaths(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new])
        if (payload.eventType === 'UPDATE') setPaths(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
        if (payload.eventType === 'DELETE') setPaths(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [mapData?.id])

  return {
    mapData, markers, paths, loading,
    updateMapView, lockMap, unlockMap,
    addMarker, deleteMarker,
    addPath, deletePath,
  }
}

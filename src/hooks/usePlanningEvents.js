import { useEffect, useState, useCallback } from 'react'
import { supabase, rowToPlanningEvent, planningEventToRow, planningEventToUpdateRow } from '../lib/supabase'

export function usePlanningEvents({ enabled = true, festivalId } = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('planning_events')
      .select('*')
      .eq('festival_id', festivalId)
      .order('start_at', { ascending: true })
    if (error) return { error }
    return { data: (data ?? []).map(rowToPlanningEvent) }
  }, [festivalId])

  useEffect(() => {
    if (!enabled || !festivalId) {
      setEvents([])
      setLoading(false)
      return
    }

    let active = true

    fetchAll().then(({ data, error }) => {
      if (!active) return
      if (error) setError(error)
      else { setEvents(data); setError(null) }
    }).finally(() => { if (active) setLoading(false) })

    const channel = supabase
      .channel(`planning_events:${festivalId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planning_events', filter: `festival_id=eq.${festivalId}` }, (payload) => {
        if (!active) return
        setEvents(prev => {
          if (payload.eventType === 'INSERT') {
            const row = rowToPlanningEvent(payload.new)
            if (prev.find(e => e.id === row.id)) return prev
            return [...prev, row]
          }
          if (payload.eventType === 'UPDATE') {
            const row = rowToPlanningEvent(payload.new)
            return prev.map(e => e.id === row.id ? row : e)
          }
          if (payload.eventType === 'DELETE') return prev.filter(e => e.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [enabled, festivalId, fetchAll])

  const addEvent = useCallback(async (e) => {
    const row = planningEventToRow(e, festivalId)
    const { data, error } = await supabase.from('planning_events').insert(row).select().maybeSingle()
    if (error) { setError(error); return { error } }
    if (!data) { const err = new Error('event introuvable après insertion'); setError(err); return { error: err } }
    return { data: rowToPlanningEvent(data) }
  }, [festivalId])

  const updateEvent = useCallback(async (e) => {
    const row = planningEventToUpdateRow(e)
    const { data, error } = await supabase.from('planning_events').update(row).eq('id', e.id).select().maybeSingle()
    if (error) { setError(error); return { error } }
    if (!data) { const err = new Error('event introuvable après mise à jour'); setError(err); return { error: err } }
    return { data: rowToPlanningEvent(data) }
  }, [])

  const deleteEvent = useCallback(async (id) => {
    const { error } = await supabase.from('planning_events').delete().eq('id', id)
    if (error) { setError(error); return { error } }
    setEvents(prev => prev.filter(e => e.id !== id))
    return { error: null }
  }, [])

  return { events, loading, error, addEvent, updateEvent, deleteEvent }
}

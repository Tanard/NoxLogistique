import { useEffect, useState, useCallback } from 'react'
import { supabase, rowToTodo, todoToInsertRow, todoToUpdateRow } from '../lib/supabase'

export function useTodos({ enabled = true, festivalId } = {}) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('festival_id', festivalId)
      .order('created_at', { ascending: false })

    if (error) return { error }
    return { data: (data ?? []).map(rowToTodo) }
  }, [festivalId])

  useEffect(() => {
    // #1 : guard festivalId undefined — évite canal `todos:undefined` + data leak inter-festival
    if (!enabled || !festivalId) {
      setTodos([])
      setLoading(false)
      return
    }

    let active = true

    fetchAll().then(({ data, error }) => {
      if (!active) return
      if (error) setError(error)
      else { setTodos(data); setError(null) }
    }).finally(() => { if (active) setLoading(false) })

    const channel = supabase
      .channel(`todos:${festivalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `festival_id=eq.${festivalId}` },
        (payload) => {
          if (!active) return
          setTodos((prev) => {
            if (payload.eventType === 'INSERT') {
              const row = rowToTodo(payload.new)
              if (prev.find(t => t.id === row.id)) return prev
              return [row, ...prev]
            }
            if (payload.eventType === 'UPDATE') {
              const row = rowToTodo(payload.new)
              return prev.map(t => t.id === row.id ? row : t)
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(t => t.id !== payload.old.id)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [enabled, festivalId, fetchAll])

  // #8 : refetch met à jour setTodos (fetchAll brut ne le faisait pas)
  const refetch = useCallback(async () => {
    const { data, error } = await fetchAll()
    if (data) setTodos(data)
    return { data, error }
  }, [fetchAll])

  const addTodo = useCallback(async (t) => {
    setError(null) // #3 : reset erreur précédente
    const row = todoToInsertRow(t, festivalId)
    const { data, error } = await supabase.from('todos').insert(row).select().maybeSingle()
    if (error) { setError(error); return { error } }
    if (!data) {
      const err = new Error('todo introuvable après insertion')
      setError(err)
      return { error: err }
    }
    return { data: rowToTodo(data) }
  }, [festivalId])

  const updateTodo = useCallback(async (t) => {
    setError(null) // #3 : reset erreur précédente
    const row = todoToUpdateRow(t) // #4 : festival_id exclu du payload UPDATE
    const { data, error } = await supabase
      .from('todos').update(row).eq('id', t.id).select().maybeSingle()
    if (error) { setError(error); return { error } }
    if (!data) {
      const err = new Error('todo introuvable après mise à jour')
      setError(err)
      return { error: err }
    }
    return { data: rowToTodo(data) }
  }, [])

  const deleteTodo = useCallback(async (id) => {
    setError(null) // #3 : reset erreur précédente
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) setError(error)
    return { error: error ?? null }
  }, [])

  return { todos, loading, error, addTodo, updateTodo, deleteTodo, refetch }
}

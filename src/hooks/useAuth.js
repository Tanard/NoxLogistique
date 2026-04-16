import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser]       = useState(undefined) // undefined = pas encore chargé
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  // Charge le rôle depuis festival_members pour un festivalId donné
  const loadRole = useCallback(async (userId, festivalId) => {
    if (!userId || !festivalId) { setRole(null); return }
    const { data } = await supabase
      .from('festival_members')
      .select('role')
      .eq('festival_id', festivalId)
      .eq('user_id', userId)
      .maybeSingle()
    if (isMounted.current) setRole(data?.role ?? null)
  }, [])

  useEffect(() => {
    isMounted.current = true

    // 1. Lecture initiale de la session (cache local Supabase)
    // C4 — .catch() ajouté : évite que l'app reste bloquée en état "loading"
    //      si le réseau est KO ou si Supabase retourne une erreur inattendue
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted.current) return
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[useAuth] getSession failed:', err)
        if (!isMounted.current) return
        setUser(null)
        setLoading(false)
      })

    // 2. Écoute tous les changements d'état auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted.current) return
      setUser(session?.user ?? null)
      if (!session) setRole(null)
    })

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    return { data, error }
  }, [])

  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName ?? email.split('@')[0] } },
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    // Clear l'état React immédiatement pour une UX instantanée
    setUser(null)
    setRole(null)
    // Puis nettoie la session Supabase (localStorage + serveur)
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[signOut]', e)
    }
  }, [])

  return {
    user: user === undefined ? null : user,
    role,
    isAdmin:  role === 'admin',
    isEditor: role === 'admin' || role === 'pole_manager',
    loading:  loading || user === undefined,
    loadRole,
    signIn,
    signUp,
    signOut,
  }
}

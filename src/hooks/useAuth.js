import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Capture le type de flux (invite / recovery) avant que Supabase ne nettoie l'URL.
// Doit être lu au niveau module (avant tout render React) pour ne pas rater le paramètre.
// Supabase met le paramètre `type` dans le HASH (#access_token=...&type=invite),
// pas dans les query params — on vérifie les deux pour couvrir tous les cas.
const _initialFlowType = (() => {
  try {
    const hash   = new URLSearchParams(window.location.hash.substring(1))
    const search = new URLSearchParams(window.location.search)
    return hash.get('type') ?? search.get('type')
  } catch { return null }
})()

export function useAuth() {
  const [user, setUser]       = useState(undefined) // undefined = pas encore chargé
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  // true si l'utilisateur vient d'un lien d'invitation ou de réinitialisation
  const [needsPasswordSet, setNeedsPasswordSet] = useState(
    _initialFlowType === 'invite' || _initialFlowType === 'recovery'
  )

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return
      setUser(session?.user ?? null)
      if (!session) setRole(null)
      // Quand l'utilisateur arrive via un lien d'invitation, Supabase émet
      // un événement SIGNED_IN avec session.user.app_metadata.provider = 'email'
      // et l'URL contient type=invite (déjà capturé dans _initialFlowType).
      // On active aussi needsPasswordSet si l'event indique une invitation.
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.invited_at) {
        setNeedsPasswordSet(true)
      }
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

  // Définit le mot de passe de l'utilisateur connecté (flux invite / recovery)
  const setPassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setNeedsPasswordSet(false)
    return { error }
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
    isAdmin:       role === 'admin',
    isEditor:      role === 'admin' || role === 'pole_manager',
    loading:       loading || user === undefined,
    needsPasswordSet,
    isRecovery:    _initialFlowType === 'recovery',
    loadRole,
    signIn,
    signUp,
    signOut,
    setPassword,
  }
}

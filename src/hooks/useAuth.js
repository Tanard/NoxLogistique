import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const _initialFlowType = (() => {
  try {
    const hash   = new URLSearchParams(window.location.hash.substring(1))
    const search = new URLSearchParams(window.location.search)
    return hash.get('type') ?? search.get('type')
  } catch { return null }
})()

const EDITOR_ROLES  = ['super_admin', 'admin', 'pole_manager', 'utilisateur']
const MANAGER_ROLES = ['super_admin', 'admin', 'pole_manager']
const ADMIN_ROLES   = ['super_admin', 'admin']

export function useAuth() {
  const [user, setUser]             = useState(undefined)
  const [role, setRole]             = useState(null)
  const [membership, setMembership] = useState(null)
  const [loading, setLoading]       = useState(true)
  const isMounted = useRef(true)

  const [needsPasswordSet, setNeedsPasswordSet] = useState(
    _initialFlowType === 'invite' || _initialFlowType === 'recovery'
  )

  const loadRole = useCallback(async (userId, festivalId) => {
    if (!userId || !festivalId) {
      setRole(null)
      setMembership(null)
      return
    }

    // Vérifie d'abord si l'utilisateur est super_admin sur N'IMPORTE quel festival
    const { data: superAdminRow } = await supabase
      .from('festival_members')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle()

    if (superAdminRow) {
      if (isMounted.current) {
        setRole('super_admin')
        setMembership({ role: 'super_admin', poles: null, module_permissions: {} })
      }
      return
    }

    // Sinon charge le rôle pour le festival courant
    const { data } = await supabase
      .from('festival_members')
      .select('role, poles, module_permissions')
      .eq('festival_id', festivalId)
      .eq('user_id', userId)
      .maybeSingle()
    if (isMounted.current) {
      setRole(data?.role ?? null)
      setMembership(data ?? null)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return
      setUser(session?.user ?? null)
      if (!session) { setRole(null); setMembership(null) }
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

  const setPassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setNeedsPasswordSet(false)
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    setUser(null)
    setRole(null)
    setMembership(null)
    try { await supabase.auth.signOut() } catch (e) { console.error('[signOut]', e) }
  }, [])

  const isSuperAdmin  = role === 'super_admin'
  const isAdmin       = ADMIN_ROLES.includes(role)
  const isResponsable = role === 'pole_manager'
  const isEditor      = EDITOR_ROLES.includes(role)
  const isManager     = MANAGER_ROLES.includes(role)

  const assignedPoles     = membership?.poles ?? null
  const modulePermissions = useMemo(
    () => membership?.module_permissions ?? {},
    [membership]
  )

  const canViewModule = useCallback((moduleId) => {
    if (isManager) return true
    if (moduleId === 'admin') return false
    if (moduleId === 'home')  return true
    if (!isEditor) return false
    if (!assignedPoles || assignedPoles.length === 0) return false
    return moduleId in modulePermissions
  }, [isManager, isEditor, assignedPoles, modulePermissions])

  const canEditModule = useCallback((moduleId) => {
    if (isManager) return true
    if (!assignedPoles || assignedPoles.length === 0) return false
    return modulePermissions[moduleId] === 'edit'
  }, [isManager, assignedPoles, modulePermissions])

  const canAccessModule = canViewModule

  const canAccessPole = useCallback((poleLabel) => {
    if (isManager) return true
    if (!assignedPoles || assignedPoles.length === 0) return false
    return assignedPoles.includes(poleLabel)
  }, [isManager, assignedPoles])

  const canManageRole = useCallback((targetRole, targetUserId) => {
    if (isSuperAdmin) return true
    if (isAdmin) return !ADMIN_ROLES.includes(targetRole) && targetUserId !== user?.id
    if (isResponsable) return !MANAGER_ROLES.includes(targetRole)
    return false
  }, [isSuperAdmin, isAdmin, isResponsable, user?.id])

  return {
    user: user === undefined ? null : user,
    role,
    isSuperAdmin,
    isAdmin,
    isResponsable,
    isEditor,
    isManager,
    loading:       loading || user === undefined,
    needsPasswordSet,
    isRecovery:    _initialFlowType === 'recovery',
    assignedPoles,
    modulePermissions,
    canViewModule,
    canEditModule,
    canAccessModule,
    canAccessPole,
    canManageRole,
    loadRole,
    signIn,
    signUp,
    signOut,
    setPassword,
  }
}

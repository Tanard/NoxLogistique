import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useBesoins } from './hooks/useBesoins'
import { useFestival } from './hooks/useFestival'
import { useTodos } from './hooks/useTodos'
import { POLES } from './constants'
import { useFestivalMembers } from './hooks/useFestivalMembers'
import { LoadingScreen } from './components/LoadingScreen'
import { Sidebar } from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import { ModalFestivalSelect } from './modals/ModalFestivalSelect'
import { ModalNouveau } from './modals/ModalNouveau'
import { ModalDetail } from './modals/ModalDetail'
import { ModalSetPassword } from './modals/ModalSetPassword'
import { ModalTodo } from './modals/ModalTodo'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TodoPage = lazy(() => import('./pages/TodoPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const DEFAULT_SORT_CHAIN = [
  { key: 'statut', dir: 'asc' },
  { key: 'pole',   dir: 'asc' },
  { key: 'zone',   dir: 'asc' },
]

export default function App() {
  const navigate = useNavigate()

  const [appLoading, setAppLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selectedBesoin, setSelectedBesoin] = useState(null)
  const [filterPole, setFilterPole] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortChain, setSortChain] = useState(DEFAULT_SORT_CHAIN)
  const [showFestivalSelect, setShowFestivalSelect] = useState(false)
  const [appVisible, setAppVisible] = useState(false)

  const [showNewTodo, setShowNewTodo] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState(null)
  const [todoSearch, setTodoSearch] = useState('')

  // Fix #14 — Toast system
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const showToast = useCallback((message, type = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 3500)
  }, [])
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  const { user, isAdmin, isEditor, signIn, signUp, signOut, loadRole, needsPasswordSet, isRecovery, setPassword } = useAuth()
  const { festivals, activeFestival, selectedId, selectFestival, loadingFestivals } = useFestival(user?.id)

  // A2 — Fusion des deux effets loadRole en un seul
  useEffect(() => {
    if (user?.id && selectedId) {
      loadRole(user.id, selectedId)
    } else {
      loadRole(null, null)
    }
  }, [user?.id, selectedId, loadRole])

  // Fix #7 & #12 & #26 — Ouvre le sélecteur de festival au PREMIER login seulement.
  const prevUserIdRef = useRef(null)
  useEffect(() => {
    if (!user?.id) {
      prevUserIdRef.current = null
      return
    }
    if (loadingFestivals || festivals.length === 0) return
    if (prevUserIdRef.current !== user.id) {
      prevUserIdRef.current = user.id
      let hasSavedFestival = false
      try { hasSavedFestival = !!localStorage.getItem('logisticore_festival_id') } catch {}
      if (festivals.length !== 1 && !hasSavedFestival) {
        setShowFestivalSelect(true)
      }
    }
  }, [user?.id, loadingFestivals, festivals.length])

  // Fix #13 — Reset des états locaux à la déconnexion
  useEffect(() => {
    if (!user) {
      setFilterPole(null)
      setSearchQuery('')
      setSelectedBesoin(null)
      setSortChain(DEFAULT_SORT_CHAIN)
      setShowNew(false)
      setShowNewTodo(false)
      setSelectedTodo(null)
      setTodoSearch('')
      navigate('/dashboard')
    }
  }, [user, navigate])

  // Fix #23 — Fondu d'entrée quand l'app devient visible
  useEffect(() => {
    if (user && !appLoading) {
      const raf = requestAnimationFrame(() => setAppVisible(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setAppVisible(false)
    }
  }, [user?.id, appLoading])

  const festivalMembers = useFestivalMembers(selectedId ?? undefined)

  const {
    besoins,
    addBesoin: addBesoinDB,
    updateBesoin: updateBesoinDB,
    deleteBesoin: deleteBesoinDB,
  } = useBesoins({ enabled: !!user && !!selectedId, festivalId: selectedId ?? undefined })

  const {
    todos,
    loading: todosLoading,
    addTodo: addTodoDB,
    updateTodo: updateTodoDB,
    deleteTodo: deleteTodoDB,
  } = useTodos({ enabled: !!user && !!selectedId, festivalId: selectedId ?? undefined })

  useEffect(() => { setTodoSearch('') }, [selectedId])

  const counts = useMemo(() => {
    const map = {}
    POLES.forEach(p => { map[p.label] = 0 })
    besoins.forEach(b => { if (map[b.pole] !== undefined) map[b.pole]++ })
    return map
  }, [besoins])

  // Fix #19 — Ferme la modal de détail si le besoin est supprimé via Realtime
  useEffect(() => {
    if (selectedBesoin && !besoins.find(b => b.id === selectedBesoin.id)) {
      setSelectedBesoin(null)
    }
  }, [besoins, selectedBesoin])

  const handleSort = (key) => {
    setSortChain(prev => {
      if (prev[0]?.key === key) {
        return [{ key, dir: prev[0].dir === 'asc' ? 'desc' : 'asc' }, ...prev.slice(1)]
      }
      const rest = prev.filter(s => s.key !== key).slice(0, 2)
      return [{ key, dir: 'asc' }, ...rest]
    })
  }

  const filtered = useMemo(() => {
    let list = besoins.filter(b => {
      if (filterPole && b.pole !== filterPole) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (b.designation ?? '').toLowerCase().includes(q) || (b.usage ?? '').toLowerCase().includes(q) || (b.pole ?? '').toLowerCase().includes(q)
      }
      return true
    })
    const STATUT_ORDER = { 'En attente': 0, 'Validé': 1, 'Annulé': 2 }
    const compareByKey = (a, b, key, dir) => {
      let result
      if (key === 'quantite') {
        result = Number(a[key]) - Number(b[key])
      } else if (key === 'statut') {
        result = (STATUT_ORDER[a.statut] ?? 99) - (STATUT_ORDER[b.statut] ?? 99)
      } else {
        result = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'fr')
      }
      return dir === 'asc' ? result : -result
    }
    list = [...list].sort((a, b) => {
      for (const { key, dir } of sortChain) {
        const r = compareByKey(a, b, key, dir)
        if (r !== 0) return r
      }
      return 0
    })
    return list
  }, [besoins, filterPole, searchQuery, sortChain])

  const addBesoin = async (data) => {
    const { error } = await addBesoinDB(data)
    if (error) { console.error('[App] addBesoin failed:', error); showToast('Erreur lors de la sauvegarde', 'error') }
  }

  const updateBesoin = async (updated) => {
    const { error } = await updateBesoinDB(updated)
    if (error) { console.error('[App] updateBesoin failed:', error); showToast('Erreur lors de la sauvegarde', 'error') }
  }

  const deleteBesoin = async (id) => {
    const { error } = await deleteBesoinDB(id)
    if (error) { console.error('[App] deleteBesoin failed:', error); showToast('Erreur lors de la sauvegarde', 'error') }
    return { error }
  }

  const addTodo = useCallback(async (data) => {
    const { error } = await addTodoDB(data)
    if (error) { console.error('[App] addTodo failed:', error); showToast('Erreur lors de la sauvegarde', 'error') }
    return { error }
  }, [addTodoDB, showToast])

  const updateTodo = useCallback(async (data) => {
    const { error } = await updateTodoDB(data)
    if (error) { console.error('[App] updateTodo failed:', error); showToast('Erreur lors de la sauvegarde', 'error') }
    return { error }
  }, [updateTodoDB, showToast])

  const deleteTodo = useCallback(async (id) => {
    const { error } = await deleteTodoDB(id)
    if (error) { console.error('[App] deleteTodo failed:', error); showToast('Erreur lors de la sauvegarde', 'error') }
    return { error }
  }, [deleteTodoDB, showToast])

  const handleLoadingDone = useCallback(() => setAppLoading(false), [])

  if (appLoading) {
    return <LoadingScreen onDone={handleLoadingDone} />
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} onSignUp={signUp} />
  }

  if (needsPasswordSet) {
    return (
      <ModalSetPassword
        open
        onDone={() => {}}
        setPassword={setPassword}
        isRecovery={isRecovery}
      />
    )
  }

  return (
    <div
      className="flex h-screen overflow-hidden transition-opacity duration-400"
      style={{ opacity: appVisible ? 1 : 0 }}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeFestival={activeFestival}
        loadingFestivals={loadingFestivals}
        user={user}
        isAdmin={isAdmin}
        onFestivalClick={() => setShowFestivalSelect(true)}
      />

      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                user={user}
                isAdmin={isAdmin}
                isEditor={isEditor}
                signOut={signOut}
                activeFestival={activeFestival}
                selectedId={selectedId}
                besoins={besoins}
                filtered={filtered}
                counts={counts}
                filterPole={filterPole}
                setFilterPole={setFilterPole}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortKey={sortChain[0]?.key}
                sortDir={sortChain[0]?.dir}
                handleSort={handleSort}
                setSelectedBesoin={setSelectedBesoin}
                setShowNew={setShowNew}
                setShowFestivalSelect={setShowFestivalSelect}
              />
            }
          />
          <Route
            path="/todo"
            element={
              <TodoPage
                isEditor={isEditor}
                todos={todos}
                loading={todosLoading}
                searchQuery={todoSearch}
                setSearchQuery={setTodoSearch}
                setShowNew={setShowNewTodo}
                setSelectedTodo={setSelectedTodo}
                user={user}
                isAdmin={isAdmin}
                activeFestival={activeFestival}
                onFestivalClick={() => setShowFestivalSelect(true)}
                signOut={signOut}
              />
            }
          />
          <Route
            path="/map"
            element={
              <MapPage
                festivalId={selectedId ?? undefined}
                isEditor={isEditor}
              />
            }
          />
          <Route
            path="/admin"
            element={
              isAdmin
                ? <AdminPage
                    isAdmin={isAdmin}
                    festivals={festivals}
                    showToast={showToast}
                    user={user}
                    activeFestival={activeFestival}
                    onFestivalClick={() => setShowFestivalSelect(true)}
                    signOut={signOut}
                  />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>

      {/* Modals */}
      <ModalNouveau open={showNew} onClose={() => setShowNew(false)} onSave={addBesoin} />
      <ModalDetail
        open={!!selectedBesoin}
        onClose={() => setSelectedBesoin(null)}
        besoin={selectedBesoin}
        onUpdate={updateBesoin}
        onDelete={deleteBesoin}
        isAdmin={isAdmin}
        isEditor={isEditor}
      />
      <ModalFestivalSelect
        open={showFestivalSelect}
        onClose={() => setShowFestivalSelect(false)}
        festivals={festivals}
        selectedId={selectedId}
        onSelect={selectFestival}
      />
      {(showNewTodo || !!selectedTodo) && (
        <ModalTodo
          open
          onClose={() => { setShowNewTodo(false); setSelectedTodo(null) }}
          todo={showNewTodo ? null : selectedTodo}
          onSave={addTodo}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
          isAdmin={isAdmin}
          isEditor={isEditor}
          festivalId={selectedId ?? undefined}
          festivalMembers={festivalMembers}
        />
      )}

      {/* Fix #14 — Toast notifications */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            background: toast.type === 'error' ? '#DC2626' : '#059669',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            maxWidth: '320px',
            pointerEvents: 'none',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { useBesoins } from './hooks/useBesoins'
import { useFestival } from './hooks/useFestival'
import { POLES, SORT_KEYS } from './constants'
import { LoadingScreen } from './components/LoadingScreen'
import { Sidebar } from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { ModalFestivalSelect } from './modals/ModalFestivalSelect'
import { ModalNouveau } from './modals/ModalNouveau'
import { ModalDetail } from './modals/ModalDetail'
import AdminPage from './pages/AdminPage'

export default function App() {
  const [appLoading, setAppLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('general')
  const [showNew, setShowNew] = useState(false)
  const [selectedBesoin, setSelectedBesoin] = useState(null)
  const [filterPole, setFilterPole] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [showFestivalSelect, setShowFestivalSelect] = useState(false)
  const [appVisible, setAppVisible] = useState(false)

  // Fix #14 — Toast system
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const showToast = useCallback((message, type = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 3500)
  }, [])

  // Auth Supabase
  const { user, isAdmin, isEditor, signIn, signUp, signOut, loadRole } = useAuth()

  // Festivals accessibles à l'utilisateur connecté
  const { festivals, activeFestival, selectedId, selectFestival, loadingFestivals } = useFestival(user?.id)

  // Fix #5 — Reset immédiat du rôle quand le festival change
  useEffect(() => {
    loadRole(null, null)
  }, [selectedId, loadRole])

  // Fix #5 — Charge le nouveau rôle
  useEffect(() => {
    if (user?.id && selectedId) loadRole(user.id, selectedId)
  }, [user?.id, selectedId, loadRole])

  // Fix #7 & #12 & #26 — Ouvre auto le sélecteur de festival au login si != 1 festival dispo
  // Fix #26 : usar ref pour ne pas ouvrir après un F5, seulement au premier login
  const hasShownFestivalSelectRef = useRef(false)
  useEffect(() => {
    if (user && !loadingFestivals && festivals.length !== 1 && !selectedId && !hasShownFestivalSelectRef.current) {
      setShowFestivalSelect(true)
      hasShownFestivalSelectRef.current = true
    }
  }, [user?.id, loadingFestivals, festivals.length, selectedId])

  // Fix #26 : réinitialiser la ref au logout
  useEffect(() => {
    if (!user) {
      hasShownFestivalSelectRef.current = false
    }
  }, [user])

  // Fix #13 — Reset des états locaux à la déconnexion
  useEffect(() => {
    if (!user) {
      setFilterPole(null)
      setSearchQuery('')
      setSelectedBesoin(null)
      setSortKey(null)
      setSortDir('asc')
      setActiveNav('general')
      setShowNew(false)
    }
  }, [user])

  // Fix #23 — Fondu d'entrée quand l'app devient visible (après login)
  useEffect(() => {
    if (user && !appLoading) {
      // requestAnimationFrame garantit que le DOM est prêt avant de déclencher la transition
      const raf = requestAnimationFrame(() => setAppVisible(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setAppVisible(false)
    }
  }, [user?.id, appLoading])

  // Besoins avec sync temps réel (activé seulement si connecté + festival sélectionné)
  const {
    besoins,
    addBesoin: addBesoinDB,
    updateBesoin: updateBesoinDB,
    deleteBesoin: deleteBesoinDB,
  } = useBesoins({ enabled: !!user && !!selectedId, festivalId: selectedId ?? undefined })

  const counts = useMemo(() => {
    const map = {}
    POLES.forEach(p => { map[p.label] = 0 })
    besoins.forEach(b => { if (map[b.pole] !== undefined) map[b.pole]++ })
    return map
  }, [besoins])

  // Fix #19 — Ferme la modal de détail si le besoin affiché est supprimé via Realtime
  useEffect(() => {
    if (selectedBesoin && !besoins.find(b => b.id === selectedBesoin.id)) {
      setSelectedBesoin(null)
    }
  }, [besoins, selectedBesoin])

  const handleSort = (header) => {
    const key = SORT_KEYS[header]
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Fix #3 — nullish coalescing on designation/usage/pole
  const filtered = useMemo(() => {
    let list = besoins.filter(b => {
      if (filterPole && b.pole !== filterPole) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (b.designation ?? '').toLowerCase().includes(q) || (b.usage ?? '').toLowerCase().includes(q) || (b.pole ?? '').toLowerCase().includes(q)
      }
      return true
    })
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey]
        if (sortKey === 'quantite') { va = Number(va); vb = Number(vb) }
        else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase() }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return list
  }, [besoins, filterPole, searchQuery, sortKey, sortDir])

  // Fix #14 — showToast on error
  const addBesoin = async (data) => {
    const { error } = await addBesoinDB(data)
    if (error) {
      console.error('[App] addBesoin failed:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    }
  }

  const updateBesoin = async (updated) => {
    const { error } = await updateBesoinDB(updated)
    if (error) {
      console.error('[App] updateBesoin failed:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    }
  }

  const deleteBesoin = async (id) => {
    const { error } = await deleteBesoinDB(id)
    if (error) {
      console.error('[App] deleteBesoin failed:', error)
      showToast('Erreur lors de la sauvegarde', 'error')
    }
  }

  // Fix #22 — wrap onDone in useCallback
  const handleLoadingDone = useCallback(() => setAppLoading(false), [])

  // Loading screen shown once on first mount
  if (appLoading) {
    return <LoadingScreen onDone={handleLoadingDone} />
  }

  // Fix #18 — Not authenticated — show full-screen login page only (no duplicate ModalLogin)
  if (!user) {
    return <LoginPage onSignIn={signIn} onSignUp={signUp} />
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        opacity: appVisible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        activeFestival={activeFestival}
        loadingFestivals={loadingFestivals}
        user={user}
        isAdmin={isAdmin}
        onFestivalClick={() => setShowFestivalSelect(true)}
      />

      {/* Onglet Administration (admin uniquement) */}
      {activeNav === 'admin' && isAdmin && (
        <AdminPage
          isAdmin={isAdmin}
          festivals={festivals}
          showToast={showToast}
        />
      )}

      {/* Fix #21 — isEditor passed as prop (already present) */}
      {activeNav !== 'admin' && (
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
          sortKey={sortKey}
          sortDir={sortDir}
          handleSort={handleSort}
          setSelectedBesoin={setSelectedBesoin}
          setShowNew={setShowNew}
          setShowFestivalSelect={setShowFestivalSelect}
        />
      )}

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

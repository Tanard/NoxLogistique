import { useState } from 'react'
import { useUsers } from '../hooks/useUsers'
import { ModalUser } from '../modals/ModalUser'
import { COLORS } from '../constants'
import { Search, UserPlus, Users, RefreshCw } from 'lucide-react'

// Configuration visuelle des rôles
export const ROLE_CONFIG = {
  admin:        { label: 'Admin',        bg: '#EF444420', text: '#EF4444', border: '#EF444460' },
  pole_manager: { label: 'Responsable',  bg: '#F9731620', text: '#EA580C', border: '#F9731660' },
  viewer:       { label: 'Viewer',       bg: '#22C55E20', text: '#16A34A', border: '#22C55E60' },
}

/** Retourne le rôle le plus élevé parmi les memberships d'un utilisateur */
function getTopRole(memberships) {
  if (memberships.some(m => m.role === 'admin'))        return 'admin'
  if (memberships.some(m => m.role === 'pole_manager')) return 'pole_manager'
  return 'viewer'
}

/** Badge coloré selon le rôle */
function RoleBadge({ role }) {
  const rc = ROLE_CONFIG[role] ?? ROLE_CONFIG.viewer
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}
    >
      {rc.label}
    </span>
  )
}

export default function AdminPage({ isAdmin, festivals, showToast }) {
  const [searchQuery, setSearchQuery]     = useState('')
  const [selectedUser, setSelectedUser]   = useState(null)
  const [showCreate, setShowCreate]       = useState(false)
  const [festivalSort, setFestivalSort]   = useState('name')
  const [festivalSortDir, setFestivalSortDir] = useState('asc')

  const {
    users, loading, reload,
    updateRole, addMembership, removeMembership,
    createUser, deleteUser, sendPasswordReset,
  } = useUsers({ enabled: isAdmin })

  // Calcule les stats par festival
  const festivalStats = festivals.map(f => {
    const members = users.filter(u => u.memberships.some(m => m.festivalId === f.id))
    const admins = members.filter(u => u.memberships.find(m => m.festivalId === f.id)?.role === 'admin')
    const poleManagers = members.filter(u => u.memberships.find(m => m.festivalId === f.id)?.role === 'pole_manager')
    return {
      ...f,
      memberCount: members.length,
      adminCount: admins.length,
      poleManagerCount: poleManagers.length,
    }
  })

  // Tri des festivals
  const sortedFestivals = [...festivalStats].sort((a, b) => {
    let va, vb
    if (festivalSort === 'name') {
      va = (a.name ?? '').toLowerCase()
      vb = (b.name ?? '').toLowerCase()
    } else if (festivalSort === 'members') {
      va = a.memberCount
      vb = b.memberCount
    } else if (festivalSort === 'admins') {
      va = a.adminCount
      vb = b.adminCount
    }
    if (va < vb) return festivalSortDir === 'asc' ? -1 : 1
    if (va > vb) return festivalSortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleFestivalSort = (key) => {
    if (festivalSort === key) {
      setFestivalSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setFestivalSort(key)
      setFestivalSortDir('asc')
    }
  }

  const filtered = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (u.email ?? '').toLowerCase().includes(q)
      || (u.fullName ?? '').toLowerCase().includes(q)
  })

  // Après une opération dans le modal, resync l'objet sélectionné
  // pour que les données affichées restent à jour sans fermer le modal
  const syncSelected = (userId) => {
    const fresh = users.find(u => u.id === userId)
    if (fresh) setSelectedUser(fresh)
  }

  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: COLORS.bg }}>
      <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-5xl mx-auto">

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>
              Gestion des utilisateurs
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Chargement…' : `${users.length} utilisateur${users.length > 1 ? 's' : ''} enregistré${users.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={reload}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors disabled:opacity-40"
            title="Rafraîchir"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Festivals ────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>Festivals</h3>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl overflow-hidden shadow-sm bg-white mb-4">
            <table className="w-full" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2D2650' }}>
                  <th
                    onClick={() => handleFestivalSort('name')}
                    className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      Festival
                      {festivalSort === 'name' && (festivalSortDir === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th
                    onClick={() => handleFestivalSort('members')}
                    className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      Membres
                      {festivalSort === 'members' && (festivalSortDir === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                  <th
                    onClick={() => handleFestivalSort('admins')}
                    className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      Admins
                      {festivalSort === 'admins' && (festivalSortDir === 'asc' ? '▲' : '▼')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFestivals.map((f, i) => (
                  <tr
                    key={f.id}
                    className="hover:bg-purple-50 transition-colors border-b border-gray-100"
                    style={i % 2 !== 0 ? { backgroundColor: '#FAFAF8' } : {}}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: COLORS.textDark }}>{f.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: COLORS.textDark }}>
                      {f.memberCount} {f.memberCount > 1 ? 'utilisateurs' : 'utilisateur'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        {f.adminCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sortedFestivals.map(f => (
              <div key={f.id} className="rounded-xl p-4 shadow-sm bg-white">
                <p className="font-semibold text-sm mb-2" style={{ color: COLORS.textDark }}>{f.name}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{f.memberCount} utilisateur{f.memberCount > 1 ? 's' : ''}</span>
                  <span className="text-red-700 font-medium">{f.adminCount} admin{f.adminCount > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Barre de recherche + bouton créer ────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ backgroundColor: COLORS.accent }}
          >
            <UserPlus size={16} />
            Créer
          </button>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par email ou nom…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              style={{ color: COLORS.textDark }}
            />
          </div>
        </div>

        {/* ── Tableau desktop ──────────────────────────────────────────────── */}
        <div className="hidden md:block rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2D2650' }}>
                <th className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3">
                  Utilisateur
                </th>
                <th className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3">
                  Rôle max.
                </th>
                <th className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3">
                  Festivals
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400">Chargement…</td>
                </tr>
              )}
              {!loading && filtered.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="cursor-pointer hover:bg-purple-50 transition-colors border-b border-gray-100"
                  style={i % 2 !== 0 ? { backgroundColor: '#FAFAF8' } : {}}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: COLORS.textDark }}>{u.fullName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={getTopRole(u.memberships)} />
                  </td>
                  <td className="px-4 py-3">
                    {u.memberships.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Aucun festival</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {u.memberships.map(m => (
                          <span
                            key={m.festivalId}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                          >
                            {m.festivalName}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400">
                    {searchQuery ? 'Aucun utilisateur ne correspond à la recherche' : 'Aucun utilisateur enregistré'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Cartes mobile ────────────────────────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {loading && (
            <div className="text-center py-12 text-gray-400">Chargement…</div>
          )}
          {!loading && filtered.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className="rounded-xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform bg-white"
            >
              <div className="flex items-start justify-between mb-1.5 gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: COLORS.textDark }}>{u.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <RoleBadge role={getTopRole(u.memberships)} />
              </div>
              {u.memberships.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {u.memberships.map(m => (
                    <span key={m.festivalId} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {m.festivalName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">Aucun utilisateur trouvé</div>
          )}
        </div>

      </div>

      {/* ── Modal vue/édition utilisateur ─────────────────────────────────── */}
      {selectedUser && (
        <ModalUser
          open
          mode="edit"
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          festivals={festivals}
          updateRole={async (userId, festivalId, role) => {
            const res = await updateRole(userId, festivalId, role)
            await reload()
            syncSelected(userId)
            return res
          }}
          addMembership={async (userId, festivalId, role) => {
            const res = await addMembership(userId, festivalId, role)
            await reload()
            syncSelected(userId)
            return res
          }}
          removeMembership={async (userId, festivalId) => {
            const res = await removeMembership(userId, festivalId)
            await reload()
            syncSelected(userId)
            return res
          }}
          deleteUser={async (userId) => {
            const res = await deleteUser(userId)
            if (!res.error) setSelectedUser(null)
            return res
          }}
          sendPasswordReset={sendPasswordReset}
          showToast={showToast}
        />
      )}

      {/* ── Modal création utilisateur ────────────────────────────────────── */}
      {showCreate && (
        <ModalUser
          open
          mode="create"
          user={null}
          onClose={() => setShowCreate(false)}
          festivals={festivals}
          createUser={async (data) => {
            const res = await createUser(data)
            if (!res.error) {
              await reload()
              setShowCreate(false)
            }
            return res
          }}
          showToast={showToast}
        />
      )}
    </main>
  )
}

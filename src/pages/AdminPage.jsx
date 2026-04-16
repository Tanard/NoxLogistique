import { useState, useMemo } from 'react'
import { useUsers } from '../hooks/useUsers'
import { ModalUser } from '../modals/ModalUser'
import { ROLE_CONFIG, COLORS } from '../constants'  // A1 — import depuis constants (plus de circular import)
import { Search, UserPlus, Users, RefreshCw } from 'lucide-react'

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
  const [selectedFestival, setSelectedFestival] = useState(null)

  const {
    users, loading, reload,
    updateRole, addMembership, removeMembership,
    createUser, deleteUser, sendPasswordReset,
  } = useUsers({ enabled: isAdmin })

  // P1 — useMemo : évite de recalculer à chaque render inutile
  const festivalStats = useMemo(() => festivals.map(f => {
    const members = users.filter(u => u.memberships.some(m => m.festivalId === f.id))
    const admins = members.filter(u => u.memberships.find(m => m.festivalId === f.id)?.role === 'admin')
    return { ...f, memberCount: members.length, adminCount: admins.length }
  }), [festivals, users])

  // P1 — useMemo : filtre recalculé seulement quand les dépendances changent
  const filtered = useMemo(() => users.filter(u => {
    if (selectedFestival && !u.memberships.some(m => m.festivalId === selectedFestival)) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (u.email ?? '').toLowerCase().includes(q)
      || (u.fullName ?? '').toLowerCase().includes(q)
  }), [users, selectedFestival, searchQuery])

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

        {/* ── Cartes Festivals (comme les cartes besoins) ────────────────────── */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-6">
          {/* Total Festivals */}
          <button
            onClick={() => setSelectedFestival(null)}
            className="flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[180px] transition-all cursor-pointer hover:scale-[1.02]"
            style={{
              backgroundColor: COLORS.card,
              borderLeft: `3px solid ${COLORS.accent}`,
              outline: selectedFestival === null ? `2px solid ${COLORS.accent}` : 'none',
            }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.accent + '22' }}>
              <Users size={20} style={{ color: COLORS.accent }} />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 whitespace-nowrap">Festival</p>
              <p className="text-2xl font-bold text-white">{festivals.length}</p>
            </div>
          </button>

          {/* Chaque Festival */}
          {festivalStats.map(f => {
            const active = selectedFestival === f.id
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFestival(active ? null : f.id)}
                className="flex-shrink-0 flex flex-col items-start justify-between rounded-xl p-4 min-w-[200px] transition-all cursor-pointer hover:scale-[1.02]"
                style={{
                  backgroundColor: COLORS.card,
                  borderLeft: `3px solid ${COLORS.accent}`,
                  outline: active ? `2px solid ${COLORS.accent}` : 'none',
                  minHeight: '100px',
                }}
              >
                <div className="w-full">
                  <p className="text-xs text-gray-400 whitespace-nowrap">{f.name}</p>
                  <p className="text-xl font-bold text-white mt-0.5">{f.memberCount}</p>
                </div>
                <p className="text-xs text-gray-500">
                  {f.adminCount} admin{f.adminCount > 1 ? 's' : ''}
                </p>
              </button>
            )
          })}
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
                  Nom / Prénom
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
          updateRole={updateRole}
          addMembership={addMembership}
          removeMembership={removeMembership}
          onSaved={async () => {
            // Après "Valider", on recharge la liste en arrière-plan.
            // On ne rappelle PAS setSelectedUser : le modal est déjà fermé via onClose
            // (appeler setSelectedUser ici causait une réouverture du modal).
            await reload()
          }}
          deleteUser={async (userId) => {
            const res = await deleteUser(userId)
            if (!res.error) {
              setSelectedUser(null)
              await reload()
            }
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
            // P2 — reload explicite (useUsers.createUser ne recharge plus automatiquement)
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

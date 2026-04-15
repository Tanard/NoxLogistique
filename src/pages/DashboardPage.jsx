import {
  Plus,
  Search,
  ClipboardList,
  ChevronUp,
  ChevronDown,
  LogOut,
  Calendar,
} from 'lucide-react'
import { PoleBadge } from '../components/ui/PoleBadge'
import { StatutBadge } from '../components/ui/StatutBadge'
import { COLORS, POLES, SORT_KEYS, formatDate } from '../constants'

export default function DashboardPage({
  user,
  isAdmin,
  isEditor,
  signOut,
  activeFestival,
  besoins,
  filtered,
  counts,
  filterPole,
  setFilterPole,
  searchQuery,
  setSearchQuery,
  sortKey,
  sortDir,
  handleSort,
  setSelectedBesoin,
  setShowNew,
  setShowFestivalSelect,
}) {
  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: COLORS.bg }}>
      <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">

        {/* Barre du haut */}
        <div className="flex justify-end mb-4">
          {user ? (
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <button
                onClick={() => setShowFestivalSelect(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: COLORS.accent, backgroundColor: COLORS.accent + '15' }}
                title="Changer de festival"
              >
                <Calendar size={15} />
                {activeFestival?.name ?? 'Festival'}
              </button>
              <span className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                <span className="text-gray-500">Connecté :</span> {user.user_metadata?.full_name || user.email}
                {isAdmin && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: COLORS.accent }}>Admin</span>}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Déconnexion
              </button>
            </div>
          ) : null}
        </div>

        {/* Cartes résumé */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-3">
          <button
            onClick={() => setFilterPole(null)}
            className="flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[180px] transition-all cursor-pointer hover:scale-[1.02]"
            style={{
              backgroundColor: COLORS.card,
              borderLeft: `3px solid ${COLORS.accent}`,
              outline: filterPole === null ? `2px solid ${COLORS.accent}` : 'none',
            }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.accent + '22' }}>
              <ClipboardList size={20} style={{ color: COLORS.accent }} />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 whitespace-nowrap">Besoin</p>
              <p className="text-2xl font-bold text-white">{besoins.length}</p>
            </div>
          </button>
          {POLES.map(pole => {
            const active = filterPole === pole.label
            return (
              <button
                key={pole.label}
                onClick={() => setFilterPole(active ? null : pole.label)}
                className="flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[180px] transition-all cursor-pointer hover:scale-[1.02]"
                style={{
                  backgroundColor: COLORS.card,
                  borderLeft: `3px solid ${pole.color}`,
                  outline: active ? `2px solid ${pole.color}` : 'none',
                }}
              >
                <div className="p-2 rounded-lg" style={{ backgroundColor: pole.color + '22' }}>
                  <pole.icon size={20} style={{ color: pole.color }} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400 whitespace-nowrap">{pole.label}</p>
                  <p className="text-2xl font-bold text-white">{counts[pole.label]}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Header tableau */}
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2" style={{ color: COLORS.textDark }}>
            Besoins {filterPole && <span className="text-sm font-normal text-gray-500">— {filterPole}</span>}
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {(user && isEditor) && (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ backgroundColor: COLORS.accent }}
              >
                <Plus size={18} />
                Nouveau Besoin
              </button>
            )}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un besoin..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                style={{ color: COLORS.textDark }}
              />
            </div>
          </div>
        </div>

        {/* Tableau desktop */}
        <div className="hidden md:block rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#2D2650' }}>
                {['Pôle', 'Date', 'Désignation', 'Quantité', 'Statut'].map(h => (
                  <th
                    key={h}
                    onClick={() => handleSort(h)}
                    className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-2.5 cursor-pointer select-none hover:text-white transition-colors"
                  >
                    <span className="inline-flex items-center gap-1">
                      {h}
                      {sortKey === SORT_KEYS[h] && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedBesoin(b)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                  style={i % 2 === 0 ? {} : { backgroundColor: '#FAFAF8' }}
                >
                  <td className="px-4 py-1.5"><PoleBadge pole={b.pole} /></td>
                  <td className="px-4 py-1.5" style={{ color: COLORS.textDark }}>{formatDate(b.date)}</td>
                  <td className="px-4 py-1.5 font-medium" style={{ color: COLORS.textDark }}>{b.designation}</td>
                  <td className="px-4 py-1.5 text-center" style={{ color: COLORS.textDark }}>{b.quantite}</td>
                  <td className="px-4 py-1.5"><StatutBadge statut={b.statut} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Aucun besoin trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cartes mobile */}
        <div className="md:hidden space-y-3">
          {filtered.map(b => (
            <div
              key={b.id}
              onClick={() => setSelectedBesoin(b)}
              className="rounded-xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <PoleBadge pole={b.pole} />
                <StatutBadge statut={b.statut} />
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: COLORS.textDark }}>{b.designation}</h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(b.date)}</span>
                <span>Qté : {b.quantite}</span>
              </div>
              {b.usage && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{b.usage}</p>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">Aucun besoin trouvé</div>
          )}
        </div>

      </div>
    </main>
  )
}

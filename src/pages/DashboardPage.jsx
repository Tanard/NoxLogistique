import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, ClipboardList } from 'lucide-react'
import { PoleBadge } from '../components/ui/PoleBadge'
import { StatutBadge } from '../components/ui/StatutBadge'
import { SortableHeader } from '../components/ui/SortableHeader'
import { TopBar } from '../components/ui/TopBar'
import { PageLayout } from '../components/ui/PageLayout'
import { POLES, formatDate } from '../constants'

const COLUMNS = [
  { label: 'Pôle',        key: 'pole' },
  { label: 'Zone',        key: 'zone' },
  { label: 'Date',        key: 'date' },
  { label: 'Désignation', key: 'designation' },
  { label: 'Quantité',    key: 'quantite' },
  { label: 'Statut',      key: 'statut' },
]

const PAGE_SIZE = 20

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
  const [currentPage, setCurrentPage] = useState(1)
  useEffect(() => { setCurrentPage(1) }, [filterPole, searchQuery])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <PageLayout wide>
      <TopBar
        user={user}
        isAdmin={isAdmin}
        activeFestival={activeFestival}
        onFestivalClick={() => setShowFestivalSelect(true)}
        onSignOut={signOut}
      />

      {/* Cartes résumé */}
      <div className="flex gap-4 overflow-x-auto pb-2 mb-3">
        <button
          onClick={() => setFilterPole(null)}
          className={`flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[180px] bg-card border-l-[3px] border-accent cursor-pointer transition-opacity hover:opacity-90 ${filterPole === null ? 'outline outline-2 outline-accent' : ''}`}
        >
          <div className="p-2 rounded-lg bg-accent/15">
            <ClipboardList size={20} className="text-accent" />
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
              className={`flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[180px] bg-card cursor-pointer transition-opacity hover:opacity-90 ${active ? 'outline outline-2' : ''}`}
              style={{ borderLeft: `3px solid ${pole.color}`, outlineColor: active ? pole.color : undefined }}
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
        <h2 className="text-lg font-bold mb-2 text-app-text">
          Besoins {filterPole && <span className="text-sm font-normal text-gray-500">— {filterPole}</span>}
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {(user && isEditor) && (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity flex-shrink-0"
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
              className="input-light pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tableau desktop */}
      <div className="hidden md:block rounded-xl overflow-hidden shadow-sm bg-white">
        <table className="w-full" style={{ fontSize: '13px' }}>
          <thead>
            <tr className="bg-table-hd">
              {COLUMNS.map(col => (
                <SortableHeader
                  key={col.key}
                  label={col.label}
                  sortKey={col.key}
                  currentKey={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((b, i) => (
              <tr
                key={b.id}
                onClick={() => setSelectedBesoin(b)}
                className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                style={i % 2 === 0 ? {} : { backgroundColor: '#FAFAF8' }}
              >
                <td className="px-4 py-1.5"><PoleBadge pole={b.pole} /></td>
                <td className="px-4 py-1.5 text-gray-500">{b.zone || '—'}</td>
                <td className="px-4 py-1.5 text-app-text">{formatDate(b.date)}</td>
                <td className="px-4 py-1.5 font-medium text-app-text">{b.designation}</td>
                <td className="px-4 py-1.5 text-center text-app-text">{b.quantite}</td>
                <td className="px-4 py-1.5">
                  <StatutBadge statut={b.statut} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Aucun besoin trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg px-3 py-1.5 text-sm bg-white border border-gray-200 disabled:opacity-40 hover:border-gray-300 transition-colors"
          >
            Précédent
          </button>
          <span className="text-sm text-app-text">
            Page <span className="font-bold text-accent">{currentPage}</span> sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm bg-white border border-gray-200 disabled:opacity-40 hover:border-gray-300 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Cartes mobile */}
      <div className="md:hidden space-y-3 mt-3">
        {paginated.map(b => (
          <div
            key={b.id}
            onClick={() => setSelectedBesoin(b)}
            className="rounded-xl p-4 shadow-sm cursor-pointer bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <PoleBadge pole={b.pole} />
              <StatutBadge statut={b.statut} />
            </div>
            <h3 className="text-sm font-bold mb-1 text-app-text">{b.designation}</h3>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDate(b.date)}</span>
              <span>Qté : {b.quantite}</span>
            </div>
            {b.zone && <p className="text-xs text-gray-400 mt-1">Zone : {b.zone}</p>}
            {b.usage && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{b.usage}</p>}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">Aucun besoin trouvé</div>
        )}
      </div>
    </PageLayout>
  )
}

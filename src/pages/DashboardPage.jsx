import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, ClipboardList } from 'lucide-react'
import { PoleBadge } from '../components/ui/PoleBadge'
import { StatutBadge } from '../components/ui/StatutBadge'
import { SortableHeader } from '../components/ui/SortableHeader'
import { TopBar } from '../components/ui/TopBar'
import { PageLayout } from '../components/ui/PageLayout'
import { ModalNouvelleEntree } from '../modals/ModalNouvelleEntree'
import { POLES, formatDate, COLOR_SIDEBAR } from '../constants'

const COLUMNS = [
  { label: 'Pôle',     key: 'pole' },
  { label: 'Zone',     key: 'zone' },
  { label: 'Date',     key: 'date' },
  { label: 'Article',  key: 'designation' },
  { label: 'Quantité', key: 'quantite' },
  { label: 'Prix unit.', key: 'prix' },
  { label: 'Statut',   key: 'statut' },
]

const PAGE_SIZE = 20
const BTN_DARK = COLOR_SIDEBAR

function sortItems(items, key, dir) {
  return [...items].sort((a, b) => {
    const r = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'fr')
    return dir === 'asc' ? r : -r
  })
}

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
  zones = [],
  articles = [],
  updateZone,
  updateArticle,
  setShowNouvelleZone,
  setShowNouvelArticle,
  setShowFestivalSelect,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [activeView, setActiveView] = useState('besoins')

  // Tri tables zones / articles
  const [zoneSort, setZoneSort] = useState({ key: 'nom', dir: 'asc' })
  const [articleSort, setArticleSort] = useState({ key: 'nom', dir: 'asc' })

  // Édition zone / article
  const [editZone, setEditZone] = useState(null)
  const [editArticle, setEditArticle] = useState(null)

  useEffect(() => { setCurrentPage(1) }, [filterPole, searchQuery])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const budget = useMemo(() => {
    const avecPrix = besoins.filter(b => b.prix !== '' && b.prix !== null && b.prix !== undefined)
    return {
      total: avecPrix.reduce((s, b) => s + Number(b.prix) * Number(b.quantite), 0),
      count: avecPrix.length,
    }
  }, [besoins])
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const zonesSorted = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const items = q ? zones.filter(z => z.nom.toLowerCase().includes(q) || (z.commentaire ?? '').toLowerCase().includes(q)) : zones
    return sortItems(items, zoneSort.key, zoneSort.dir)
  }, [zones, zoneSort, searchQuery])

  const articlesSorted = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const items = q ? articles.filter(a => a.nom.toLowerCase().includes(q) || (a.commentaire ?? '').toLowerCase().includes(q)) : articles
    return sortItems(items, articleSort.key, articleSort.dir)
  }, [articles, articleSort, searchQuery])

  const toggleSort = (current, setSort, key) => {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    )
  }

  const viewBtn = (view, label, count) => {
    const active = activeView === view
    return (
      <button
        onClick={() => setActiveView(view)}
        className="text-xs font-medium px-3 py-1 rounded-lg transition-opacity"
        style={{ backgroundColor: active ? BTN_DARK : BTN_DARK + '55', color: '#fff', opacity: active ? 1 : 0.75 }}
      >
        {label}{count !== undefined ? ` (${count})` : ''}
      </button>
    )
  }

  const titles = { besoins: 'Besoins', zones: 'Zones', articles: 'Articles' }

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
      <div className="flex gap-3 overflow-x-auto pb-2 mb-3">
        <button
          onClick={() => setFilterPole(null)}
          className={`flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[160px] cursor-pointer transition-all border ${filterPole === null ? 'bg-accent border-accent text-white' : 'border-accent/30 hover:bg-accent/10'}`}
          style={filterPole === null ? {} : { backgroundColor: 'rgba(124,58,237,0.10)' }}
        >
          <div className={`p-2 rounded-lg ${filterPole === null ? 'bg-white/20' : 'bg-accent/20'}`}>
            <ClipboardList size={18} className={filterPole === null ? 'text-white' : 'text-accent'} />
          </div>
          <div className="text-left">
            <p className={`text-sm whitespace-nowrap ${filterPole === null ? 'text-white/70' : 'text-gray-600'}`}>Total besoins</p>
            <p className={`text-xl font-bold ${filterPole === null ? 'text-white' : 'text-gray-900'}`}>{besoins.length}</p>
          </div>
        </button>
        {POLES.map(pole => {
          const active = filterPole === pole.label
          return (
            <button
              key={pole.label}
              onClick={() => setFilterPole(active ? null : pole.label)}
              className="flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[160px] cursor-pointer transition-all border"
              style={{ backgroundColor: active ? pole.color : pole.color + '20', borderColor: pole.color }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = pole.color + '33' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = pole.color + '20' }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : pole.color + '33' }}>
                <pole.icon size={18} style={{ color: active ? '#fff' : pole.color }} />
              </div>
              <div className="text-left">
                <p className="text-sm whitespace-nowrap" style={{ color: active ? 'rgba(255,255,255,0.75)' : '#374151' }}>{pole.label}</p>
                <p className="text-xl font-bold" style={{ color: active ? '#fff' : '#111827' }}>{counts[pole.label]}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Encadrés budget */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 rounded-xl px-5 py-3 bg-white border border-gray-200">
          <p className="text-xs text-gray-500 mb-0.5">Budget Prévisionnel</p>
          <p className="text-lg font-bold text-app-text">{budget.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
        </div>
        <div className="flex-1 rounded-xl px-5 py-3 bg-white border border-gray-200">
          <p className="text-xs text-gray-500 mb-0.5">Besoins chiffrés</p>
          <p className="text-lg font-bold text-app-text">{budget.count} <span className="text-sm font-normal text-gray-400">/ {besoins.length}</span></p>
        </div>
      </div>

      {/* Header tableau */}
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 text-app-text">
          {titles[activeView]}
          {activeView === 'besoins' && filterPole && <span className="text-sm font-normal text-gray-500"> — {filterPole}</span>}
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 flex-wrap">

          <div className="flex flex-col gap-1 flex-shrink-0">
            {(user && isEditor) && (
              <button onClick={() => setShowNew(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-80 transition-opacity" style={{ backgroundColor: BTN_DARK }}>
                <Plus size={18} /> Nouveau Besoin
              </button>
            )}
            {viewBtn('besoins', 'Voir les besoins', filtered.length)}
          </div>

          <div className="flex flex-col gap-1 flex-shrink-0">
            {(user && isEditor) && (
              <button onClick={() => setShowNouvelleZone(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-80 transition-opacity" style={{ backgroundColor: BTN_DARK }}>
                <Plus size={16} /> Nouvelle Zone
              </button>
            )}
            {viewBtn('zones', 'Voir les zones', zones.length)}
          </div>

          <div className="flex flex-col gap-1 flex-shrink-0">
            {(user && isEditor) && (
              <button onClick={() => setShowNouvelArticle(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-80 transition-opacity" style={{ backgroundColor: BTN_DARK }}>
                <Plus size={16} /> Nouvel Article
              </button>
            )}
            {viewBtn('articles', 'Voir les articles', articles.length)}
          </div>

          <div className="relative flex-1 self-start">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeView === 'zones' ? 'Rechercher une zone…' : activeView === 'articles' ? 'Rechercher un article…' : 'Rechercher un besoin…'}
              className="input-light pl-10"
            />
          </div>
        </div>
      </div>

      {/* Vue Besoins */}
      {activeView === 'besoins' && (
        <>
          <div className="hidden md:block rounded-xl overflow-hidden bg-white border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-table-hd">
                  {COLUMNS.map(col => (
                    <SortableHeader key={col.key} label={col.label} sortKey={col.key} currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((b, i) => (
                  <tr key={b.id} onClick={() => setSelectedBesoin(b)} className="cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100" style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F4F4F5' }}>
                    <td className="px-4 py-1.5"><PoleBadge pole={b.pole} /></td>
                    <td className="px-4 py-1.5 text-gray-500">{b.zone || '—'}</td>
                    <td className="px-4 py-1.5 text-xs text-gray-400">{formatDate(b.date)}</td>
                    <td className="px-4 py-1.5 font-medium text-app-text">{b.designation}</td>
                    <td className="px-4 py-1.5 text-center text-app-text">{b.quantite}</td>
                    <td className="px-4 py-1.5 text-center text-app-text">{b.prix !== '' && b.prix !== null && b.prix !== undefined ? `${Number(b.prix).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                    <td className="px-4 py-1.5"><StatutBadge statut={b.statut} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun besoin trouvé</td></tr>}
              </tbody>
            </table>
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex justify-center items-center gap-3 mt-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg px-3 py-1.5 text-sm bg-white border border-gray-200 disabled:opacity-40 hover:border-gray-300 transition-colors">Précédent</button>
              <span className="text-sm text-app-text">Page <span className="font-bold text-accent">{currentPage}</span> sur {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg px-3 py-1.5 text-sm bg-white border border-gray-200 disabled:opacity-40 hover:border-gray-300 transition-colors">Suivant</button>
            </div>
          )}

          <div className="md:hidden space-y-3 mt-3">
            {paginated.map(b => (
              <div key={b.id} onClick={() => setSelectedBesoin(b)} className="rounded-xl p-4 border border-gray-200 cursor-pointer bg-white">
                <div className="flex items-center justify-between mb-2"><PoleBadge pole={b.pole} /><StatutBadge statut={b.statut} /></div>
                <h3 className="text-sm font-bold mb-1 text-app-text">{b.designation}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500"><span>{formatDate(b.date)}</span><span>Qté : {b.quantite}</span></div>
                {b.zone && <p className="text-xs text-gray-400 mt-1">Zone : {b.zone}</p>}
                {b.usage && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{b.usage}</p>}
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-gray-400">Aucun besoin trouvé</div>}
          </div>
        </>
      )}

      {/* Vue Zones */}
      {activeView === 'zones' && (
        <div className="rounded-xl overflow-hidden bg-white border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-table-hd">
                <SortableHeader label="Zone" sortKey="nom" currentKey={zoneSort.key} currentDir={zoneSort.dir} onSort={k => toggleSort(zoneSort, setZoneSort, k)} />
                <SortableHeader label="Commentaire" sortKey="commentaire" currentKey={zoneSort.key} currentDir={zoneSort.dir} onSort={k => toggleSort(zoneSort, setZoneSort, k)} />
              </tr>
            </thead>
            <tbody>
              {zonesSorted.length === 0 && <tr><td colSpan={2} className="px-4 py-12 text-center text-gray-400">Aucune zone configurée</td></tr>}
              {zonesSorted.map((z, i) => (
                <tr
                  key={z.id}
                  onClick={() => isEditor && setEditZone(z)}
                  className={`border-b border-gray-100 ${isEditor ? 'cursor-pointer hover:bg-gray-100' : ''} transition-colors`}
                  style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F4F4F5' }}
                >
                  <td className="px-4 py-2 font-medium text-app-text">{z.nom}</td>
                  <td className="px-4 py-2 text-gray-500 text-sm">{z.commentaire || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vue Articles */}
      {activeView === 'articles' && (
        <div className="rounded-xl overflow-hidden bg-white border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-table-hd">
                <SortableHeader label="Article" sortKey="nom" currentKey={articleSort.key} currentDir={articleSort.dir} onSort={k => toggleSort(articleSort, setArticleSort, k)} />
                <SortableHeader label="Commentaire" sortKey="commentaire" currentKey={articleSort.key} currentDir={articleSort.dir} onSort={k => toggleSort(articleSort, setArticleSort, k)} />
              </tr>
            </thead>
            <tbody>
              {articlesSorted.length === 0 && <tr><td colSpan={2} className="px-4 py-12 text-center text-gray-400">Aucun article configuré</td></tr>}
              {articlesSorted.map((a, i) => (
                <tr
                  key={a.id}
                  onClick={() => isEditor && setEditArticle(a)}
                  className={`border-b border-gray-100 ${isEditor ? 'cursor-pointer hover:bg-gray-100' : ''} transition-colors`}
                  style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F4F4F5' }}
                >
                  <td className="px-4 py-2 font-medium text-app-text">{a.nom}</td>
                  <td className="px-4 py-2 text-gray-500 text-sm">{a.commentaire || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals édition zone / article */}
      <ModalNouvelleEntree
        open={!!editZone}
        onClose={() => setEditZone(null)}
        titre="Modifier la zone"
        placeholder="Nom de la zone"
        entree={editZone}
        onSave={(nom, commentaire) => updateZone(editZone.id, nom, commentaire)}
      />
      <ModalNouvelleEntree
        open={!!editArticle}
        onClose={() => setEditArticle(null)}
        titre="Modifier l'article"
        placeholder="Nom de l'article"
        entree={editArticle}
        onSave={(nom, commentaire) => updateArticle(editArticle.id, nom, commentaire)}
      />
    </PageLayout>
  )
}

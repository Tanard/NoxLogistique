import { useMemo, useState } from 'react'
import { Plus, Search, User } from 'lucide-react'
import { TodoStatutBadge } from '../components/ui/TodoStatutBadge'
import { SortableHeader } from '../components/ui/SortableHeader'
import { PageLayout, PageHeader } from '../components/ui/PageLayout'
import { TopBar } from '../components/ui/TopBar'

const STATUT_ORDER = { 'À faire': 0, 'En cours': 1, 'Terminé': 2 }

const COLUMNS = [
  { label: 'Tâche',   key: 'titre' },
  { label: 'Assigné', key: 'assignee' },
  { label: 'Statut',  key: 'statut' },
]

export default function TodoPage({
  isEditor,
  todos,
  loading,
  searchQuery,
  setSearchQuery,
  setShowNew,
  setSelectedTodo,
  user,
  isAdmin,
  activeFestival,
  onFestivalClick,
  signOut,
}) {
  const [sortKey, setSortKey] = useState('statut')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let list = todos
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(t =>
        (t.titre ?? '').toLowerCase().includes(q) ||
        (t.assignee ?? '').toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      )
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va, vb
        if (sortKey === 'statut') {
          va = STATUT_ORDER[a.statut] ?? 99
          vb = STATUT_ORDER[b.statut] ?? 99
          if (va < vb) return sortDir === 'asc' ? -1 : 1
          if (va > vb) return sortDir === 'asc' ? 1 : -1
          return 0
        }
        va = String(a[sortKey] ?? '').toLowerCase()
        vb = String(b[sortKey] ?? '').toLowerCase()
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return list
  }, [todos, searchQuery, sortKey, sortDir])

  return (
    <PageLayout>
      <TopBar
        user={user}
        isAdmin={isAdmin}
        activeFestival={activeFestival}
        onFestivalClick={onFestivalClick}
        onSignOut={signOut}
      />
      <PageHeader title="Todo" subtitle="Suivi des tâches par festival" />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {isEditor && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Plus size={18} />
            Créer une tâche
          </button>
        )}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher une tâche, un assigné..."
            className="input-light pl-10"
          />
        </div>
        {!loading && (
          <span className="text-sm text-gray-400 flex-shrink-0">
            {filtered.length} tâche{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 text-sm">Chargement…</div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl overflow-hidden bg-white border border-gray-200">
            <table className="w-full">
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
                  <th className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wider px-4 py-3">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTodo(t)}
                    className="cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100"
                    style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F4F4F5' }}
                  >
                    <td className="px-4 py-3 font-semibold max-w-[240px] text-app-text">{t.titre}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-app-text">
                        <User size={13} className="text-gray-400 flex-shrink-0" />
                        {t.assignee || <span className="text-gray-400 italic">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TodoStatutBadge statut={t.statut} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[300px] truncate">
                      {t.description || <span className="italic">—</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400">
                      {todos.length === 0 ? 'Aucune tâche pour ce festival' : 'Aucune tâche trouvée'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTodo(t)}
                className="rounded-xl p-4 border border-gray-200 cursor-pointer bg-white"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold leading-snug text-app-text">{t.titre}</h3>
                  <TodoStatutBadge statut={t.statut} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User size={12} />
                  <span>{t.assignee || '—'}</span>
                </div>
                {t.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.description}</p>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                {todos.length === 0 ? 'Aucune tâche pour ce festival' : 'Aucune tâche trouvée'}
              </div>
            )}
          </div>
        </>
      )}
    </PageLayout>
  )
}

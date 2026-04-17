import { useMemo, useState } from 'react'
import { Plus, Search, ChevronUp, ChevronDown, User } from 'lucide-react'
import { TodoStatutBadge } from '../components/ui/TodoStatutBadge'
import { COLORS } from '../constants'

// #16 : source unique — label affiché + clé de tri définis au même endroit
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
}) {
  const [sortKey, setSortKey] = useState(null)
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
        t.titre.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      )
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const va = String(a[sortKey]).toLowerCase()
        const vb = String(b[sortKey]).toLowerCase()
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return list
  }, [todos, searchQuery, sortKey, sortDir])

  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: COLORS.bg }}>
      <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.textDark }}>Todo</h1>
          <p className="text-sm text-gray-500">Suivi des tâches par festival</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          {isEditor && (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ backgroundColor: COLORS.accent }}
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              style={{ color: COLORS.textDark }}
            />
          </div>
          {!loading && (
            <span className="text-sm text-gray-400 flex-shrink-0">
              {filtered.length} tâche{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* #7 : état de chargement */}
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400 text-sm">Chargement…</div>
        ) : (
          <>
            {/* Tableau desktop */}
            <div className="hidden md:block rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full" style={{ fontSize: '13px' }}>
                <thead>
                  {/* #12 : COLORS.tableHeader au lieu de #2D2650 hardcodé */}
                  <tr style={{ backgroundColor: COLORS.tableHeader }}>
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-white transition-colors"
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </span>
                      </th>
                    ))}
                    <th className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-3">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTodo(t)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                      style={i % 2 === 0 ? {} : { backgroundColor: '#FAFAF8' }}
                    >
                      <td className="px-4 py-3 font-semibold max-w-[240px]" style={{ color: COLORS.textDark }}>
                        {t.titre}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: COLORS.textDark }}>
                          <User size={13} className="text-gray-400 flex-shrink-0" />
                          {t.assignee}
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

            {/* Cartes mobile */}
            <div className="md:hidden space-y-3">
              {filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTodo(t)}
                  className="rounded-xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform bg-white"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold leading-snug" style={{ color: COLORS.textDark }}>{t.titre}</h3>
                    <TodoStatutBadge statut={t.statut} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <User size={12} />
                    <span>{t.assignee}</span>
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

      </div>
    </main>
  )
}

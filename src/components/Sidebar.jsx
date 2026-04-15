import { Calendar, Menu } from 'lucide-react'
import { NAV_ITEMS, COLORS } from '../constants'

export function Sidebar({ sidebarOpen, setSidebarOpen, activeNav, setActiveNav, activeFestival, loadingFestivals, user, isAdmin, onFestivalClick }) {
  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg"
        style={{ backgroundColor: COLORS.sidebar }}
      >
        <Menu size={22} />
      </button>

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 flex-shrink-0 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: COLORS.sidebar }}
      >
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-white tracking-wide">Logisticore</h1>
          <button
            onClick={() => user && onFestivalClick()}
            className="text-xs mt-0.5 truncate text-left transition-opacity hover:opacity-70"
            style={{ color: COLORS.accent }}
            title={user ? 'Changer de festival' : ''}
          >
            {activeFestival?.name ?? (user ? (loadingFestivals ? 'Chargement…' : 'Aucun festival') : '—')}
          </button>
        </div>
        <nav className="flex-1 px-3 mt-4">
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${activeNav === item.id ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
              style={activeNav === item.id ? { backgroundColor: COLORS.accent + '20', color: '#fff', borderLeft: `3px solid ${COLORS.accent}` } : {}}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 text-xs text-gray-600">v1.0</div>
      </aside>
    </>
  )
}

import { Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../constants'

const NAV_PATH = { home: '/', general: '/dashboard', todo: '/todo', map: '/map', admin: '/admin', planning: '/planning' }

export function Sidebar({ sidebarOpen, setSidebarOpen, isAdmin }) {
  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Ouvrir le menu"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg bg-sidebar"
      >
        <Menu size={22} />
      </button>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 flex-shrink-0 flex flex-col bg-sidebar border-r border-white/10 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 pb-2">
          <NavLink to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/nox-logo.svg" alt="Logisticore" className="w-8 h-4 object-contain flex-shrink-0" />
            <h1 className="text-xl font-bold text-white tracking-wide leading-tight">
              Logisticore
              <span className="block text-[11px] font-normal text-gray-400 tracking-normal leading-tight -mt-0.5">
                outil de gestion logistique événementiel
              </span>
            </h1>
          </NavLink>
        </div>
        <nav className="flex-1 px-3 mt-4">
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
            <NavLink
              key={item.id}
              to={NAV_PATH[item.id]}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-1 ${isActive ? 'text-white bg-accent/20 border-l-[3px] border-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-gray-600">v1.0</div>
      </aside>
    </>
  )
}

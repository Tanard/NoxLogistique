import { LogOut, Calendar } from 'lucide-react'
import { BtnSoft } from './buttons'

export function TopBar({ user, isAdmin, activeFestival, onFestivalClick, onSignOut }) {
  return (
    <div className="flex justify-between items-center gap-3 flex-wrap mb-4 pb-4 border-b border-gray-700">
      <BtnSoft icon={Calendar} onClick={onFestivalClick} title="Changer de festival">
        {activeFestival?.name ?? 'Festival'}
      </BtnSoft>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-app-text">
          <span className="text-gray-400">Connecté :</span>{' '}
          {user?.user_metadata?.full_name || user?.email}
          {isAdmin && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold text-white bg-accent">
              Admin
            </span>
          )}
        </span>
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>
    </div>
  )
}

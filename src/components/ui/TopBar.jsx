import { LogOut, Calendar } from 'lucide-react'
import { COLORS } from '../../constants'
import { BtnSoft } from './buttons'

export function TopBar({ user, isAdmin, activeFestival, onFestivalClick, onSignOut }) {
  return (
    <div className="flex justify-end items-center gap-3 flex-wrap mb-4">
      <BtnSoft icon={Calendar} onClick={onFestivalClick} title="Changer de festival">
        {activeFestival?.name ?? 'Festival'}
      </BtnSoft>
      <span className="text-sm font-medium" style={{ color: COLORS.textDark }}>
        <span className="text-gray-500">Connecté :</span>{' '}
        {user?.user_metadata?.full_name || user?.email}
        {isAdmin && (
          <span
            className="ml-2 px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{ backgroundColor: COLORS.accent }}
          >
            Admin
          </span>
        )}
      </span>
      <button
        onClick={onSignOut}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut size={15} />
        Déconnexion
      </button>
    </div>
  )
}

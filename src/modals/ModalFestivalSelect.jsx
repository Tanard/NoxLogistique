import { Calendar } from 'lucide-react'
import { COLORS } from '../constants'

export function ModalFestivalSelect({ open, onClose, festivals, selectedId, onSelect }) {
  if (!open) return null

  const noFestivals = festivals.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl p-6"
        style={{ backgroundColor: COLORS.sidebar }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <Calendar size={22} style={{ color: COLORS.accent }} />
          <h2 className="text-lg font-bold text-white">Sélectionner un festival</h2>
        </div>

        {noFestivals ? (
          <div className="text-center py-6">
            <div className="mb-4 text-5xl">🎪</div>
            <p className="text-white font-semibold mb-2">Aucun festival trouvé</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ton compte n'est membre d'aucun festival.<br />
              Contacte un administrateur pour être ajouté.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {festivals.map(f => {
              const isActive = f.id === selectedId
              const roleLabel = f.role === 'admin' ? 'Admin' : f.role === 'pole_manager' ? 'Responsable pôle' : 'Viewer'
              const roleColor = f.role === 'admin' ? COLORS.accent : f.role === 'pole_manager' ? '#F472B6' : '#6B7280'
              return (
                <button
                  key={f.id}
                  onClick={() => { onSelect(f.id); onClose() }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all text-left"
                  style={{
                    backgroundColor: isActive ? COLORS.accent + '25' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isActive ? COLORS.accent : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{f.name}</p>
                    {f.slug && <p className="text-gray-500 text-xs mt-0.5">{f.slug}</p>}
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white ml-3 flex-shrink-0"
                    style={{ backgroundColor: roleColor }}
                  >
                    {roleLabel}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

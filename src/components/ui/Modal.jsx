import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, onConfirm, children, title }) {
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Enter' && onConfirm && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        onConfirm()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose, onConfirm])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 md:px-8 pt-6 md:pt-8 pb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6 md:pb-8 min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}

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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 bg-white border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

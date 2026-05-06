import { AlertCircle } from 'lucide-react'

export function ErrorBlock({ message, code }) {
  if (!message) return null
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex gap-2.5 items-start">
      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm text-red-600">{message}</p>
        {code && (
          <p className="text-xs text-red-400 font-mono mt-1 select-all" title="Code d'erreur — copiez-le pour le partager">
            {code}
          </p>
        )}
      </div>
    </div>
  )
}

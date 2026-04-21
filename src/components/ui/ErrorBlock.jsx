/**
 * Affichage uniforme des erreurs dans toute l'app.
 *
 * - message : texte lisible affiché en rouge
 * - code    : identifiant technique en petit (pour partage diagnostic)
 *
 * Usage :
 *   import { ErrorBlock } from '../components/ui/ErrorBlock'
 *   <ErrorBlock message={msg} code={code} />
 */
import { AlertCircle } from 'lucide-react'

export function ErrorBlock({ message, code }) {
  if (!message) return null
  return (
    <div className="bg-red-500/10 rounded-lg px-3 py-2.5 flex gap-2.5 items-start">
      <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm text-red-400">{message}</p>
        {code && (
          <p className="text-xs text-red-400/70 font-mono mt-1 select-all" title="Code d'erreur — copiez-le pour le partager">
            {code}
          </p>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Modal } from '../components/ui/Modal'
import { PasswordInput } from '../components/ui/PasswordInput'
import { ErrorBlock } from '../components/ui/ErrorBlock'
import { parseError } from '../lib/errors'
import { COLORS } from '../constants'
import { KeyRound } from 'lucide-react'

/**
 * Affiché quand un utilisateur arrive via un lien d'invitation ou de réinitialisation.
 * Il doit définir (ou redéfinir) son mot de passe avant d'accéder à l'app.
 * La modal ne peut pas être fermée — l'action est obligatoire.
 */
export function ModalSetPassword({ open, onDone, setPassword, isRecovery = false }) {
  const [password, setPasswordVal]   = useState('')
  const [confirm, setConfirm]        = useState('')
  const [error, setError]            = useState(null)
  const [saving, setSaving]          = useState(false)

  const handleSubmit = async () => {
    if (password.length < 6) return setError({ message: 'Le mot de passe doit faire au moins 6 caractères.', code: null })
    if (password !== confirm)  return setError({ message: 'Les mots de passe ne correspondent pas.', code: null })
    setError(null)
    setSaving(true)
    try {
      const { error: err } = await setPassword(password)
      if (err) setError(parseError(err))
      else onDone()
    } finally {
      setSaving(false)
    }
  }

  const title = isRecovery ? 'Nouveau mot de passe' : 'Activer votre compte'

  return (
    // onClose = noop — l'utilisateur doit compléter cette étape
    <Modal open={open} onClose={() => {}} title={title}>
      <div className="space-y-5">

        {/* Icône + message */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.accent + '25' }}
          >
            <KeyRound size={26} style={{ color: COLORS.accent }} />
          </div>
          <p className="text-sm text-gray-400 text-center">
            {isRecovery
              ? 'Choisissez votre nouveau mot de passe.'
              : 'Bienvenue sur Logisticore ! Choisissez un mot de passe pour activer votre compte.'}
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {isRecovery ? 'Nouveau mot de passe *' : 'Mot de passe *'}
          </label>
          <PasswordInput
            value={password}
            onChange={e => setPasswordVal(e.target.value)}
            placeholder="6 caractères minimum"
            autoComplete="new-password"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Confirmer le mot de passe *</label>
          <PasswordInput
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Répétez le mot de passe"
            autoComplete="new-password"
          />
        </div>

        <ErrorBlock message={error?.message} code={error?.code} />

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: COLORS.accent }}
          >
            {saving ? 'Activation…' : (isRecovery ? 'Mettre à jour' : 'Activer mon compte')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

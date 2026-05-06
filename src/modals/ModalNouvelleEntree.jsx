import { useState, useEffect } from 'react'
import { Modal } from '../components/ui/Modal'

export function ModalNouvelleEntree({ open, onClose, titre, placeholder, onSave, entree = null }) {
  const [nom, setNom] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setNom(entree?.nom ?? '')
    setCommentaire(entree?.commentaire ?? '')
    setError('')
    setLoading(false)
  }, [open, entree])

  const handleSave = async () => {
    if (!nom.trim()) { setError('Ce champ est requis'); return }
    setLoading(true)
    const { error } = await onSave(nom, commentaire)
    setLoading(false)
    if (error) { setError('Erreur lors de l\'enregistrement'); return }
    onClose()
  }

  const editing = !!entree

  return (
    <Modal open={open} onClose={onClose} onConfirm={handleSave} title={titre}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input
            type="text"
            value={nom}
            onChange={e => { setNom(e.target.value); setError('') }}
            placeholder={placeholder}
            className="input-light"
            required
            autoFocus
          />
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
          <textarea
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            rows={3}
            placeholder="Informations complémentaires…"
            className="input-light resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Annuler</button>
        <button onClick={handleSave} disabled={loading || !nom.trim()} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Enregistrement…' : editing ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </Modal>
  )
}

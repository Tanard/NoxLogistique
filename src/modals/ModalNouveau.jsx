import { useState, useEffect, useMemo } from 'react'
import { Modal } from '../components/ui/Modal'
import { POLES, todayISO } from '../constants'

export function ModalNouveau({ open, onClose, onSave, zones = [], articles = [] }) {
  const [form, setForm] = useState({ pole: POLES[0].label, zone: '', designation: '', quantite: '', prix: '', caracteristique: '', usage: '' })
  const [supplementsActif, setSupplementsActif] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    if (!open) return
    setForm({ pole: POLES[0].label, zone: '', designation: '', quantite: '', prix: '', caracteristique: '', usage: '' })
    setSupplementsActif(false)
    setError('')
    setLoading(false)
  }, [open])

  const handleSupplementsToggle = (checked) => {
    setSupplementsActif(checked)
    if (!checked) set('usage', '')
  }

  const handleSave = async () => {
    setError('')
    if (!form.designation) { setError('L\'article est requis'); return }
    if (!form.quantite || Number(form.quantite) <= 0) { setError('La quantité doit être supérieure à 0'); return }

    setLoading(true)
    try {
      const result = await onSave({
        ...form,
        quantite: Number(form.quantite),
        date: todayISO(),
        statut: 'En attente',
        longueur: '', largeur: '', hauteur: '',
        electricite: 'Non', electriciteDetail: '',
        eau: 'Non', eauDetail: '',
      })
      if (result?.error) return
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const zonesSorted = useMemo(() => [...zones].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [zones])
  const articlesSorted = useMemo(() => [...articles].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [articles])

  return (
    <Modal open={open} onClose={onClose} onConfirm={handleSave} title="Nouveau Besoin">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pôle</label>
          <select value={form.pole} onChange={e => set('pole', e.target.value)} className="input-light">
            {[...POLES].sort((a, b) => a.label.localeCompare(b.label, 'fr')).map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
          <select value={form.zone} onChange={e => set('zone', e.target.value)} className="input-light">
            <option value="">— Aucune —</option>
            {zonesSorted.map(z => <option key={z.id} value={z.nom}>{z.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Article *</label>
          <select value={form.designation} onChange={e => set('designation', e.target.value)} className="input-light">
            <option value="">— Choisir un article —</option>
            {articlesSorted.map(a => <option key={a.id} value={a.nom}>{a.nom}</option>)}
          </select>
          {articlesSorted.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Aucun article configuré. Utilisez "Nouvel Article" pour en ajouter.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
            <input type="number" min="1" value={form.quantite} onChange={e => set('quantite', e.target.value)} placeholder="0" className="input-light" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (€)</label>
            <input type="number" min="0" step="0.01" value={form.prix} onChange={e => set('prix', e.target.value)} placeholder="0.00" className="input-light" />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={supplementsActif}
              onChange={e => handleSupplementsToggle(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Suppléments</span>
          </label>
          {supplementsActif && (
            <textarea
              value={form.usage}
              onChange={e => set('usage', e.target.value)}
              rows={2}
              placeholder="Détails supplémentaires…"
              className="input-light resize-none mt-2"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
          <textarea value={form.caracteristique} onChange={e => set('caracteristique', e.target.value)} rows={2} placeholder="Commentaire…" className="input-light resize-none" />
        </div>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Annuler</button>
        <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Enregistrement…' : 'Valider'}
        </button>
      </div>
    </Modal>
  )
}

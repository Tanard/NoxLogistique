import { useState, useEffect } from 'react'
import { Modal } from '../components/ui/Modal'
import { POLES, COLORS, todayISO } from '../constants'

export function ModalNouveau({ open, onClose, onSave }) {
  const [form, setForm] = useState({ pole: POLES[0].label, zone: '', designation: '', quantite: '', caracteristique: '', usage: '' })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // Fix #15 — error and loading states
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fix #15 — reset error and loading when modal opens/closes
  useEffect(() => {
    setError('')
    setLoading(false)
  }, [open])

  // N1 — try/finally + ne pas fermer si erreur
  const handleSave = async () => {
    setError('')
    if (!form.designation.trim()) { setError('La désignation est requise'); return }
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
      if (result?.error) return  // reste ouvert, toast affiché dans App.jsx
      // Succès : reset et fermeture
      setForm({ pole: POLES[0].label, zone: '', designation: '', quantite: '', caracteristique: '', usage: '' })
      setError('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau Besoin">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Pôle</label>
          <select value={form.pole} onChange={e => set('pole', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
            {POLES.map(p => <option key={p.label} value={p.label} className="bg-gray-800">{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Zone</label>
          <input type="text" value={form.zone} onChange={e => set('zone', e.target.value)} placeholder="Ex : Entrée, Parking, Scène…" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Désignation du besoin *</label>
          <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Ex : Tables pliantes" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Quantité *</label>
          <input type="number" min="1" value={form.quantite} onChange={e => set('quantite', e.target.value)} placeholder="0" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Caractéristique technique</label>
          <textarea value={form.caracteristique} onChange={e => set('caracteristique', e.target.value)} rows={2} placeholder="Détails techniques..." className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Usage prévu</label>
          <textarea value={form.usage} onChange={e => set('usage', e.target.value)} rows={2} placeholder="À quoi cela servira-t-il ?" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
        </div>
      </div>
      {/* Fix #15 — error display */}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors">Annuler</button>
        {/* Fix #15 — disabled during loading */}
        <button onClick={handleSave} disabled={loading} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: COLORS.accent }}>
          {loading ? 'Enregistrement…' : 'Valider'}
        </button>
      </div>
    </Modal>
  )
}

import { useState, useEffect, useMemo, useRef } from 'react'
import { Modal } from '../components/ui/Modal'
import { POLES, todayISO } from '../constants'

export function ModalNouveau({ open, onClose, onSave, zones = [], articles = [], addArticle, filterPole }) {
  const [form, setForm] = useState({ pole: filterPole ?? [...POLES].sort((a, b) => a.label.localeCompare(b.label, 'fr'))[0].label, zone: '', designation: '', quantite: '', prix: '', caracteristique: '', usage: '' })
  const [supplementsActif, setSupplementsActif] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const comboRef = useRef(null)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    if (!open) return
    setForm({ pole: filterPole ?? [...POLES].sort((a, b) => a.label.localeCompare(b.label, 'fr'))[0].label, zone: '', designation: '', quantite: '', prix: '', caracteristique: '', usage: '' })
    setSupplementsActif(false)
    setError('')
    setLoading(false)
    setInputValue('')
    setShowDropdown(false)
  }, [open, filterPole])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSupplementsToggle = (checked) => {
    setSupplementsActif(checked)
    if (!checked) set('usage', '')
  }

  const zonesSorted = useMemo(() => [...zones].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [zones])
  const articlesSorted = useMemo(() => [...articles].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [articles])

  const selectedZones = useMemo(
    () => form.zone ? form.zone.split(', ').filter(Boolean) : [],
    [form.zone]
  )

  const toggleZone = (nom) => {
    const next = selectedZones.includes(nom)
      ? selectedZones.filter(z => z !== nom)
      : [...selectedZones, nom]
    set('zone', next.join(', '))
  }

  const filtered = useMemo(
    () => articlesSorted.filter(a => a.nom.toLowerCase().includes(inputValue.toLowerCase())),
    [articlesSorted, inputValue]
  )

  const isNewArticle = inputValue.trim() && !articles.some(a => a.nom.toLowerCase() === inputValue.trim().toLowerCase())

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    set('designation', val)
    setShowDropdown(true)
  }

  const handleSelect = (nom) => {
    setInputValue(nom)
    set('designation', nom)
    setShowDropdown(false)
  }

  const handleSave = async () => {
    setError('')
    if (!form.designation) { setError('L\'article est requis'); return }
    if (!form.quantite || Number(form.quantite) <= 0) { setError('La quantité doit être supérieure à 0'); return }

    setLoading(true)
    try {
      if (isNewArticle && addArticle) {
        const { error: addErr } = await addArticle(form.designation.trim())
        if (addErr) { setError('Erreur lors de l\'ajout de l\'article'); return }
      }
      const result = await onSave({
        ...form,
        designation: form.designation.trim(),
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Zone(s)</label>
          {zonesSorted.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune zone configurée.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-32 overflow-y-auto divide-y divide-gray-100">
              {zonesSorted.map(z => (
                <label key={z.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={selectedZones.includes(z.nom)} onChange={() => toggleZone(z.nom)} className="rounded" />
                  <span className="text-sm">{z.nom}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Article *</label>
          <div ref={comboRef} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="Rechercher ou créer un article…"
              className="input-light"
              autoComplete="off"
            />
            {showDropdown && (filtered.length > 0 || isNewArticle) && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filtered.map(a => (
                  <li key={a.id} onMouseDown={() => handleSelect(a.nom)} className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100">
                    {a.nom}
                  </li>
                ))}
                {isNewArticle && (
                  <li onMouseDown={() => handleSelect(inputValue.trim())} className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-blue-600 border-t border-gray-100">
                    + Créer « {inputValue.trim()} »
                  </li>
                )}
              </ul>
            )}
          </div>
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
            <input type="checkbox" checked={supplementsActif} onChange={e => handleSupplementsToggle(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-gray-700">Suppléments</span>
          </label>
          {supplementsActif && (
            <textarea value={form.usage} onChange={e => set('usage', e.target.value)} rows={2} placeholder="Détails supplémentaires…" className="input-light mt-2" spellCheck={true} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
          <textarea value={form.caracteristique} onChange={e => set('caracteristique', e.target.value)} rows={2} placeholder="Commentaire…" className="input-light" spellCheck={true} />
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

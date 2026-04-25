import { useState, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { PoleBadge } from '../components/ui/PoleBadge'
import { StatutBadge } from '../components/ui/StatutBadge'
import { BtnCycle } from '../components/ui/buttons'
import { POLES, STATUTS, formatDate } from '../constants'

export function ModalDetail({ open, onClose, besoin, onUpdate, onDelete, isAdmin, isEditor }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(besoin || {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!besoin) return
    setForm({ ...besoin })
    setEditing(false)
    setConfirmDelete(false)
  }, [besoin])

  if (!besoin) return null

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const cycleStatut = () => {
    const idx = STATUTS.findIndex(s => s.label === form.statut)
    if (idx < 0) return
    set('statut', STATUTS[(idx + 1) % STATUTS.length].label)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await onUpdate(form)
      if (result?.error) return
      setEditing(false)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { setForm({ ...besoin }); setEditing(false); setConfirmDelete(false); onClose() }} title="Détail du besoin">
      <div className="rounded-xl p-4 mb-6 bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Demande</h3>
          {(isAdmin || isEditor) && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent text-white transition-opacity hover:opacity-90"
            >
              <Pencil size={12} />
              Modifier
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Pôle</label>
              <select value={form.pole} onChange={e => set('pole', e.target.value)} className="input-dark">
                {[...POLES].sort((a, b) => a.label.localeCompare(b.label, 'fr')).map(p => <option key={p.label} value={p.label} className="bg-gray-800">{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Zone</label>
              <input type="text" value={form.zone ?? ''} onChange={e => set('zone', e.target.value)} placeholder="Ex : Entrée, Parking, Scène…" className="input-dark" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Désignation</label>
              <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)} className="input-dark" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Quantité</label>
                <input type="number" min="1" value={form.quantite} onChange={e => set('quantite', Number(e.target.value))} className="input-dark" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input type="text" value={formatDate(form.date)} disabled className="input-dark opacity-50 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Caractéristique technique</label>
              <textarea value={form.caracteristique} onChange={e => set('caracteristique', e.target.value)} rows={2} className="input-dark resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Usage prévu</label>
              <textarea value={form.usage} onChange={e => set('usage', e.target.value)} rows={2} className="input-dark resize-none" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="text-gray-400">Pôle :</span> <span className="text-white ml-1"><PoleBadge pole={form.pole} /></span></div>
            {form.zone && <div><span className="text-gray-400">Zone :</span> <span className="text-white ml-1">{form.zone}</span></div>}
            <div className="flex items-center justify-between"><span><span className="text-gray-400">Date :</span> <span className="text-white ml-1">{formatDate(form.date)}</span></span> {(isAdmin || isEditor) ? <BtnCycle onClick={cycleStatut} title="Cliquer pour changer le statut"><StatutBadge statut={form.statut} /></BtnCycle> : <StatutBadge statut={form.statut} />}</div>
            <div className="col-span-2"><span className="text-gray-400">Désignation :</span> <span className="text-white ml-1">{form.designation}</span></div>
            <div><span className="text-gray-400">Quantité :</span> <span className="text-white ml-1">{form.quantite}</span></div>
            {form.caracteristique && <div className="col-span-2"><span className="text-gray-400">Caractéristique :</span> <span className="text-white ml-1">{form.caracteristique}</span></div>}
            {form.usage && <div className="col-span-2"><span className="text-gray-400">Usage :</span> <span className="text-white ml-1">{form.usage}</span></div>}
          </div>
        )}
        {!editing && form.statut !== besoin.statut && (isAdmin || isEditor) && (
          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-white/10">
            <button onClick={() => set('statut', besoin.statut)} className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Enregistrement…' : 'Valider'}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-xl p-4 mb-6 bg-white/5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Informations logistique</h3>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Transport</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[['longueur', 'Longueur (cm)'], ['largeur', 'Largeur (cm)'], ['hauteur', 'Hauteur (cm)']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="—" className="input-dark" />
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dimensionnement</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Électricité</label>
              <select value={form.electricite} onChange={e => { set('electricite', e.target.value); if (e.target.value === 'Non') set('electriciteDetail', '') }} className="input-dark">
                <option value="Non" className="bg-gray-800">Non</option>
                <option value="Oui" className="bg-gray-800">Oui</option>
              </select>
              {form.electricite === 'Oui' && (
                <textarea value={form.electriciteDetail} onChange={e => set('electriciteDetail', e.target.value)} rows={2} placeholder="Précisez le besoin électrique..." className="mt-2 input-dark resize-none" />
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Eau</label>
              <select value={form.eau} onChange={e => { set('eau', e.target.value); if (e.target.value === 'Non') set('eauDetail', '') }} className="input-dark">
                <option value="Non" className="bg-gray-800">Non</option>
                <option value="Oui" className="bg-gray-800">Oui</option>
              </select>
              {form.eau === 'Oui' && (
                <textarea value={form.eauDetail} onChange={e => set('eauDetail', e.target.value)} rows={2} placeholder="Précisez le besoin en eau..." className="mt-2 input-dark resize-none" />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {isAdmin ? (
          !confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/15 transition-colors">
              <Trash2 size={14} />
              Supprimer
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Confirmer ?</span>
              <button
                onClick={async () => {
                  setSaving(true)
                  try {
                    const { error: delErr } = await onDelete(besoin.id) ?? {}
                    if (!delErr) onClose()
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50"
              >
                {saving ? '…' : 'Oui'}
              </button>
              <button onClick={() => setConfirmDelete(false)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs disabled:opacity-40">Non</button>
            </div>
          )
        ) : <div />}
        <div className="flex gap-3">
          {editing ? (
            <>
              <button onClick={() => { setForm({ ...besoin }); setEditing(false) }} className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Enregistrement…' : 'Valider'}
              </button>
            </>
          ) : (
            <button onClick={() => { setForm({ ...besoin }); setEditing(false); setConfirmDelete(false); onClose() }} className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors">Fermer</button>
          )}
        </div>
      </div>
    </Modal>
  )
}

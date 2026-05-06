import { useState, useEffect, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { PoleBadge } from '../components/ui/PoleBadge'
import { StatutBadge } from '../components/ui/StatutBadge'
import { BtnCycle } from '../components/ui/buttons'
import { POLES, STATUTS, formatDate } from '../constants'

export function ModalDetail({ open, onClose, besoin, onUpdate, onDelete, isAdmin, isEditor, zones = [], articles = [] }) {
  const [form, setForm] = useState(besoin || {})
  const [supplementsActif, setSupplementsActif] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!besoin) return
    setForm({ ...besoin })
    setSupplementsActif(!!besoin.usage)
    setConfirmDelete(false)
  }, [besoin])

  const zonesSorted = useMemo(() => [...zones].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [zones])
  const articlesSorted = useMemo(() => [...articles].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [articles])

  if (!besoin) return null

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const canEdit = isAdmin || isEditor

  const cycleStatut = () => {
    if (!canEdit) return
    const idx = STATUTS.findIndex(s => s.label === form.statut)
    if (idx < 0) return
    set('statut', STATUTS[(idx + 1) % STATUTS.length].label)
  }

  const handleClose = () => {
    setForm({ ...besoin })
    setSupplementsActif(!!besoin.usage)
    setConfirmDelete(false)
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await onUpdate(form)
      if (result?.error) return
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} onConfirm={canEdit ? handleSave : undefined} title="Détail du besoin">

      {/* Section DEMANDE */}
      <div className="rounded-xl p-4 mb-4 bg-gray-50 border border-gray-200">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Demande</h3>

        {/* Ligne 1 : Pôle | Zone | Date | Statut */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pôle</label>
            {canEdit ? (
              <select value={form.pole} onChange={e => set('pole', e.target.value)} className="input-light">
                {[...POLES].sort((a, b) => a.label.localeCompare(b.label, 'fr')).map(p => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            ) : (
              <PoleBadge pole={form.pole} />
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zone</label>
            {canEdit ? (
              <select value={form.zone ?? ''} onChange={e => set('zone', e.target.value)} className="input-light">
                <option value="">— Aucune —</option>
                {zonesSorted.map(z => <option key={z.id} value={z.nom}>{z.nom}</option>)}
              </select>
            ) : (
              <p className="text-sm text-gray-900">{form.zone || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <p className="text-sm text-gray-500 pt-1">{formatDate(form.date)}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Statut</label>
            {canEdit ? (
              <BtnCycle onClick={cycleStatut} title="Cliquer pour changer le statut">
                <StatutBadge statut={form.statut} />
              </BtnCycle>
            ) : (
              <StatutBadge statut={form.statut} />
            )}
          </div>
        </div>

        {/* Ligne 2 : Article | Quantité | Prix */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-1">
            <label className="block text-xs text-gray-500 mb-1">Article</label>
            {canEdit ? (
              <select value={form.designation ?? ''} onChange={e => set('designation', e.target.value)} className="input-light">
                <option value="">— Choisir un article —</option>
                {articlesSorted.map(a => <option key={a.id} value={a.nom}>{a.nom}</option>)}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-900">{form.designation}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quantité</label>
            {canEdit ? (
              <input type="number" min="1" value={form.quantite} onChange={e => set('quantite', Number(e.target.value))} className="input-light" />
            ) : (
              <p className="text-sm text-gray-900">{form.quantite}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prix unitaire (€)</label>
            {canEdit ? (
              <input type="number" min="0" step="0.01" value={form.prix ?? ''} onChange={e => set('prix', e.target.value)} placeholder="—" className="input-light" />
            ) : (
              <p className="text-sm text-gray-900">{form.prix !== '' && form.prix !== null && form.prix !== undefined ? `${Number(form.prix).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</p>
            )}
          </div>
        </div>

        {/* Ligne 3 : Suppléments */}
        <div className="mb-3">
          {canEdit ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer select-none mb-1">
                <input
                  type="checkbox"
                  checked={supplementsActif}
                  onChange={e => { setSupplementsActif(e.target.checked); if (!e.target.checked) set('usage', '') }}
                  className="rounded"
                />
                <span className="text-xs text-gray-500">Suppléments</span>
              </label>
              {supplementsActif && (
                <textarea value={form.usage ?? ''} onChange={e => set('usage', e.target.value)} rows={2} className="input-light resize-none" />
              )}
            </>
          ) : (
            form.usage && (
              <>
                <p className="text-xs text-gray-500 mb-1">Suppléments</p>
                <p className="text-sm text-gray-900">{form.usage}</p>
              </>
            )
          )}
        </div>

        {/* Ligne 4 : Commentaire */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Commentaire</label>
          {canEdit ? (
            <textarea value={form.caracteristique ?? ''} onChange={e => set('caracteristique', e.target.value)} rows={2} className="input-light resize-none" />
          ) : (
            <p className="text-sm text-gray-900">{form.caracteristique || '—'}</p>
          )}
        </div>
      </div>

      {/* Section INFORMATIONS LOGISTIQUE (admin seulement) */}
      {isAdmin && (
        <div className="rounded-xl p-4 mb-4 bg-gray-50 border border-gray-200">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Informations logistique</h3>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transport</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[['longueur', 'Longueur (cm)'], ['largeur', 'Largeur (cm)'], ['hauteur', 'Hauteur (cm)']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type="number" min="0" value={form[key] ?? ''} onChange={e => set(key, e.target.value)} placeholder="—" className="input-light" />
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dimensionnement</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Électricité</label>
              <select value={form.electricite} onChange={e => { set('electricite', e.target.value); if (e.target.value === 'Non') set('electriciteDetail', '') }} className="input-light">
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
              {form.electricite === 'Oui' && (
                <textarea value={form.electriciteDetail ?? ''} onChange={e => set('electriciteDetail', e.target.value)} rows={2} placeholder="Précisez le besoin électrique..." className="mt-2 input-light resize-none" />
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Eau</label>
              <select value={form.eau} onChange={e => { set('eau', e.target.value); if (e.target.value === 'Non') set('eauDetail', '') }} className="input-light">
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
              {form.eau === 'Oui' && (
                <textarea value={form.eauDetail ?? ''} onChange={e => set('eauDetail', e.target.value)} rows={2} placeholder="Précisez le besoin en eau..." className="mt-2 input-light resize-none" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {isAdmin ? (
          !confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
              Supprimer
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Confirmer ?</span>
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
              <button onClick={() => setConfirmDelete(false)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs disabled:opacity-40">Non</button>
            </div>
          )
        ) : <div />}

        <div className="flex gap-3">
          <button onClick={handleClose} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Fermer</button>
          {canEdit && (
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Enregistrement…' : 'Valider'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

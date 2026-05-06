import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../components/ui/Modal'

function toDateInput(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().slice(0, 10)
}

function toTimeInput(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toTimeString().slice(0, 5)
}

function buildDate(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  return new Date(`${dateStr}T${timeStr}:00`)
}

const EMPTY = { title: '', notes: '', date: '', startTime: '09:00', endTime: '10:00' }

export function ModalNouvelEvent({ open, onClose, onSave, onUpdate, onDelete, event = null, isEditor }) {
  const isNew = !event?.id
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    if (event) {
      setForm({
        title: event.title ?? '',
        notes: event.notes ?? '',
        date: toDateInput(event.start),
        startTime: toTimeInput(event.start),
        endTime: toTimeInput(event.end),
      })
    } else {
      setForm(EMPTY)
    }
    setError('')
    setConfirmDelete(false)
  }, [open, event])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Le titre est requis'); return }
    if (!form.date) { setError('La date est requise'); return }
    if (!form.startTime || !form.endTime) { setError('Les horaires sont requis'); return }
    const start = buildDate(form.date, form.startTime)
    const end = buildDate(form.date, form.endTime)
    if (end <= start) { setError("L'heure de fin doit être après le début"); return }

    setSaving(true)
    try {
      const payload = { title: form.title.trim(), notes: form.notes, start, end }
      if (isNew) {
        const { error } = await onSave(payload)
        if (error) { setError('Erreur lors de la sauvegarde'); return }
      } else {
        const { error } = await onUpdate({ ...event, ...payload })
        if (error) { setError('Erreur lors de la sauvegarde'); return }
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} onConfirm={handleSave} title={isNew ? 'Nouvel événement' : 'Événement'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Titre de l'événement"
            className="input-light text-base font-medium"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date *</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-light" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Début *</label>
            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="input-light" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fin *</label>
            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="input-light" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Ajouter des notes…"
            className="input-light resize-none"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
        <div>
          {!isNew && isEditor && (
            !confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> Supprimer
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Confirmer ?</span>
                <button onClick={async () => { setSaving(true); const { error: delErr } = await onDelete(event.id) ?? {}; setSaving(false); if (delErr) { setError('Erreur lors de la suppression'); return } onClose() }} disabled={saving} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50">{saving ? '…' : 'Oui'}</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs">Non</button>
              </div>
            )
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Fermer</button>
          {isEditor && (
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Enregistrement…' : 'Valider'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

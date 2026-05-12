import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { BtnCycle } from '../components/ui/buttons'
import { TodoStatutBadge } from '../components/ui/TodoStatutBadge'
import { TODO_STATUTS, cycleTodoStatut, POLES } from '../constants'

const EMPTY_FORM = { titre: '', assignee: '', description: '', statut: TODO_STATUTS[0].label, pole: null }

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

export function ModalTodo({ open, onClose, todo, onSave, onUpdate, onDelete, isAdmin, isEditor, festivalMembers = [] }) {
  const isNew = !todo
  const canEdit = isAdmin || isEditor
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(isNew ? EMPTY_FORM : {
      titre: todo.titre,
      assignee: todo.assignee,
      description: todo.description ?? '',
      statut: todo.statut,
      pole: todo.pole ?? null,
    })
    setError('')
    setConfirmDelete(false)
  }, [open, todo, isNew])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleClose = () => {
    if (!isNew) {
      setForm({ titre: todo.titre, assignee: todo.assignee, description: todo.description ?? '', statut: todo.statut, pole: todo.pole ?? null })
    }
    setError('')
    setConfirmDelete(false)
    onClose()
  }

  const handleSave = async () => {
    const titre = form.titre?.trim() ?? ''
    const assignee = form.assignee?.trim() ?? ''
    if (!titre) { setError('Le titre est requis.'); return }

    setSaving(true)
    try {
      const payload = { ...form, titre, assignee }
      if (isNew) {
        const { error } = await onSave(payload)
        if (error) { setError(error.message || 'Erreur lors de la sauvegarde'); return }
      } else {
        const { error } = await onUpdate({ ...todo, ...payload })
        if (error) { setError(error.message || 'Erreur lors de la sauvegarde'); return }
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setSaving(true)
    try {
      const { error } = await onDelete(todo.id)
      if (error) { setError(error.message || 'Erreur lors de la suppression'); return }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} onConfirm={canEdit ? handleSave : undefined} title={isNew ? 'Nouvelle tâche' : 'Tâche'}>
      <div className="flex flex-col gap-5 h-full">

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</span>
          {canEdit ? (
            <BtnCycle onClick={() => set('statut', cycleTodoStatut(form.statut))} title="Changer le statut">
              <TodoStatutBadge statut={form.statut} />
            </BtnCycle>
          ) : (
            <TodoStatutBadge statut={form.statut} />
          )}
        </div>

        <Field label="Tâche *">
          {canEdit ? (
            <input
              type="text"
              value={form.titre}
              onChange={e => set('titre', e.target.value)}
              placeholder="Intitulé de la tâche"
              className="input-light"
            />
          ) : (
            <p className="text-gray-900 text-sm font-medium py-2">{form.titre || '—'}</p>
          )}
        </Field>

        <Field label="Assigné à">
          {canEdit ? (
            <div className="relative">
              <input
                type="text"
                list="assignee-members"
                value={form.assignee}
                onChange={e => set('assignee', e.target.value)}
                placeholder="Nom de la personne (optionnel)"
                className="input-light"
              />
              <datalist id="assignee-members">
                {festivalMembers.map(name => <option key={name} value={name} />)}
              </datalist>
            </div>
          ) : (
            <p className="text-gray-900 text-sm py-2">{form.assignee || '—'}</p>
          )}
        </Field>

        <Field label="Pôle associé">
          {canEdit ? (
            <select value={form.pole ?? ''} onChange={e => set('pole', e.target.value || null)} className="input-light">
              <option value="">— Aucun pôle (tâche générale) —</option>
              {[...POLES].sort((a, b) => a.label.localeCompare(b.label, 'fr')).map(p => (
                <option key={p.label} value={p.label}>{p.label}</option>
              ))}
            </select>
          ) : (
            <p className="text-gray-900 text-sm py-2">{form.pole || '—'}</p>
          )}
        </Field>

        <div className="flex flex-col flex-1 min-h-0">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
          {canEdit ? (
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Détails optionnels..."
              className="input-light resize-none flex-1 min-h-[120px]"
              spellCheck={true}
            />
          ) : (
            <p className="text-gray-600 text-sm py-2 whitespace-pre-wrap flex-1">
              {form.description || <span className="text-gray-400 italic">Aucune description</span>}
            </p>
          )}
        </div>

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <div className="sticky bottom-0 bg-white flex items-center justify-between pt-2 border-t border-gray-200">
          <div>
            {!isNew && isAdmin && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-xs">Confirmer ?</span>
                  <button onClick={handleDelete} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <Trash2 size={13} /> Supprimer
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    Annuler
                  </button>
                </div>
              ) : (
                <button onClick={handleDelete} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                  <Trash2 size={13} /> Supprimer
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleClose} disabled={saving} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
              Fermer
            </button>
            {canEdit && (
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Enregistrement…' : 'Valider'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

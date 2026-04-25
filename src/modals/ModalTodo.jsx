import { useState, useEffect } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { TodoStatutBadge } from '../components/ui/TodoStatutBadge'
import { TODO_STATUTS, cycleTodoStatut } from '../constants'

const EMPTY_FORM = { titre: '', assignee: '', description: '', statut: TODO_STATUTS[0].label }

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

export function ModalTodo({ open, onClose, todo, onSave, onUpdate, onDelete, isAdmin, isEditor, festivalMembers = [] }) {
  const isNew = !todo
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    if (isNew) {
      setForm(EMPTY_FORM)
      setEditing(true)
    } else {
      setForm({
        titre: todo.titre,
        assignee: todo.assignee,
        description: todo.description ?? '',
        statut: todo.statut,
      })
      setEditing(false)
    }
    setError('')
    setConfirmDelete(false)
  }, [open, todo, isNew])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

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

  const handleCancelEdit = () => {
    if (isNew) { onClose(); return }
    setForm({ titre: todo.titre, assignee: todo.assignee, description: todo.description ?? '', statut: todo.statut })
    setError('')
    setConfirmDelete(false)
    setEditing(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Nouvelle tâche' : 'Tâche'}>
      <div className="space-y-5">

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</span>
          {editing ? (
            <button
              type="button"
              onClick={() => set('statut', cycleTodoStatut(form.statut))}
              aria-label="Changer le statut"
              className="transition-opacity hover:opacity-80"
            >
              <TodoStatutBadge statut={form.statut} />
            </button>
          ) : (
            <TodoStatutBadge statut={form.statut} />
          )}
        </div>

        <Field label="Tâche *">
          {editing ? (
            <input
              type="text"
              value={form.titre}
              onChange={e => set('titre', e.target.value)}
              placeholder="Intitulé de la tâche"
              className="input-dark"
            />
          ) : (
            <p className="text-white text-sm font-medium py-2">{form.titre || '—'}</p>
          )}
        </Field>

        <Field label="Assigné à">
          {editing ? (
            <div className="relative">
              <input
                type="text"
                list="assignee-members"
                value={form.assignee}
                onChange={e => set('assignee', e.target.value)}
                placeholder="Nom de la personne (optionnel)"
                className="input-dark"
              />
              <datalist id="assignee-members">
                {festivalMembers.map(name => <option key={name} value={name} />)}
              </datalist>
            </div>
          ) : (
            <p className="text-white text-sm py-2">{form.assignee || '—'}</p>
          )}
        </Field>

        <Field label="Description">
          {editing ? (
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Détails optionnels..."
              className="input-dark resize-none"
            />
          ) : (
            <p className="text-gray-300 text-sm py-2 whitespace-pre-wrap">
              {form.description || <span className="text-gray-500 italic">Aucune description</span>}
            </p>
          )}
        </Field>

        {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            {!isNew && isAdmin && editing && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs">Confirmer ?</span>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={13} /> Supprimer
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            {!editing && (isAdmin || isEditor) && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Pencil size={14} /> Modifier
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  <X size={14} /> Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Check size={14} /> {saving ? 'Enregistrement…' : 'Valider'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

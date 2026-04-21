import { useState } from 'react'
import { BtnDanger } from './buttons'

export function DeleteConfirm({ onDelete, disabled, label = 'Supprimer' }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await onDelete()
    } finally {
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  if (!confirmDelete) {
    return (
      <BtnDanger onClick={() => setConfirmDelete(true)} disabled={disabled}>
        {label}
      </BtnDanger>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-400">Confirmer ?</span>
      <button
        onClick={handleConfirm}
        disabled={saving || disabled}
        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50"
      >
        {saving ? '…' : 'Confirmer'}
      </button>
      <button
        onClick={() => setConfirmDelete(false)}
        disabled={saving}
        className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs"
      >
        Annuler
      </button>
    </div>
  )
}

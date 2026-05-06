import { useState, useEffect, useRef } from 'react'
import { Modal } from '../components/ui/Modal'
import { ErrorBlock } from '../components/ui/ErrorBlock'
import { parseError } from '../lib/errors'
import { ROLE_CONFIG } from '../constants'
import { Trash2, Plus, Mail, UserCircle2, X } from 'lucide-react'

const ROLES = ['admin', 'pole_manager', 'viewer']

function MembershipRow({ membership, onRoleChange, onRemove, saving }) {
  const rc = ROLE_CONFIG[membership.role] ?? ROLE_CONFIG.viewer

  const cycleRole = () => {
    const idx = ROLES.indexOf(membership.role)
    onRoleChange(ROLES[(idx + 1) % ROLES.length])
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-900 flex-1 truncate">{membership.festivalName}</span>
      <button
        onClick={cycleRole}
        disabled={saving}
        className="badge border cursor-pointer hover:opacity-80 disabled:opacity-40 transition-opacity"
        style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}
        title="Cliquez pour changer le rôle"
      >
        {rc.label}
      </button>
      <button
        onClick={onRemove}
        disabled={saving}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
        title="Retirer de ce festival"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ModalUser({
  open, onClose, mode = 'edit',
  user, festivals = [],
  updateRole, addMembership, removeMembership, deleteUser, sendPasswordReset,
  onSaved,
  createUser,
  showToast,
}) {
  const [createForm, setCreateForm] = useState({ email: '', fullName: '' })
  const [createError, setCreateError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [localMemberships, setLocalMemberships] = useState([])
  const originalRef = useRef([])

  const [addFestivalId, setAddFestivalId]     = useState('')
  const [addFestivalRole, setAddFestivalRole] = useState('viewer')

  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setCreateForm({ email: '', fullName: '' })
      setCreateError(null)
      setConfirmDelete(false)
      setAddFestivalId('')
      setAddFestivalRole('viewer')
      if (user) {
        const copy = (user.memberships ?? []).map(m => ({ ...m }))
        setLocalMemberships(copy)
        originalRef.current = copy
      }
    }
  }, [open, user?.id])

  const alreadyIn = new Set(localMemberships.map(m => m.festivalId))
  const availableFestivals = festivals.filter(f => !alreadyIn.has(f.id))

  const handleLocalRoleChange = (festivalId, newRole) => {
    setLocalMemberships(prev =>
      prev.map(m => m.festivalId === festivalId ? { ...m, role: newRole } : m)
    )
  }

  const handleLocalRemove = (festivalId) => {
    setLocalMemberships(prev => prev.filter(m => m.festivalId !== festivalId))
  }

  const handleLocalAdd = () => {
    if (!addFestivalId) return
    const festivalName = festivals.find(f => f.id === addFestivalId)?.name ?? '—'
    setLocalMemberships(prev => [
      ...prev,
      { festivalId: addFestivalId, festivalName, role: addFestivalRole },
    ])
    setAddFestivalId('')
    setAddFestivalRole('viewer')
  }

  const handleCreate = async () => {
    const { email, fullName } = createForm
    if (!email.trim()) return setCreateError({ message: "L'email est obligatoire.", code: null })
    if (!fullName.trim()) return setCreateError({ message: 'Le nom et prénom sont obligatoires.', code: null })
    setCreateError(null)
    setSaving(true)
    try {
      const { error } = await createUser({ email: email.trim().toLowerCase(), fullName: fullName.trim() || null })
      if (error) {
        setCreateError(parseError(error))
        showToast?.('Erreur lors de l\'envoi de l\'invitation', 'error')
      } else {
        showToast?.('Invitation envoyée avec succès', 'success')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const original = originalRef.current
      const current  = localMemberships
      let hasError   = false

      for (const m of original) {
        if (!current.find(c => c.festivalId === m.festivalId)) {
          const { error } = await removeMembership(user.id, m.festivalId)
          if (error) hasError = true
        }
      }

      for (const m of current) {
        if (!original.find(o => o.festivalId === m.festivalId)) {
          const { error } = await addMembership(user.id, m.festivalId, m.role)
          if (error) hasError = true
        }
      }

      for (const m of current) {
        const orig = original.find(o => o.festivalId === m.festivalId)
        if (orig && orig.role !== m.role) {
          const { error } = await updateRole(user.id, m.festivalId, m.role)
          if (error) hasError = true
        }
      }

      if (hasError) {
        showToast?.('Certaines modifications n\'ont pas pu être enregistrées', 'error')
      } else {
        showToast?.('Modifications enregistrées', 'success')
      }

      onSaved?.(user.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const { error } = await deleteUser(user.id)
      if (error) showToast?.('Erreur lors de la suppression', 'error')
      else { showToast?.('Utilisateur supprimé', 'success'); onSaved?.(); onClose() }
    } finally {
      setSaving(false)
    }
  }

  const handleSendReset = async () => {
    if (!user?.email || user.email === '—') return
    setSaving(true)
    try {
      const { error } = await sendPasswordReset(user.email)
      if (error) showToast?.('Erreur lors de l\'envoi', 'error')
      else showToast?.('Email de réinitialisation envoyé', 'success')
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'create' ? 'Créer un utilisateur' : 'Détail utilisateur'

  return (
    <Modal open={open} onClose={onClose} onConfirm={mode === 'create' ? handleCreate : handleSave} title={title}>

      {mode === 'create' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Un email d'invitation sera envoyé. L'invité clique sur le lien,
            choisit son mot de passe et son compte est activé immédiatement.
          </p>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              placeholder="prenom.nom@entreprise.com"
              className="input-light"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Nom et prénom *</label>
            <input
              type="text"
              value={createForm.fullName}
              onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Nom Prénom"
              className="input-light"
            />
          </div>

          <ErrorBlock message={createError?.message} code={createError?.code} />

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Envoi…' : 'Envoyer l\'invitation'}
            </button>
          </div>
        </div>
      )}

      {mode === 'edit' && user && (
        <>
          <div className="rounded-xl p-4 mb-5 bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-accent/10">
                <UserCircle2 size={22} className="text-accent" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 bg-gray-50 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Accès festivals
            </h3>

            {localMemberships.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Aucun accès festival attribué</p>
            ) : (
              <div>
                {localMemberships.map(m => (
                  <MembershipRow
                    key={m.festivalId}
                    membership={m}
                    saving={saving}
                    onRoleChange={newRole => handleLocalRoleChange(m.festivalId, newRole)}
                    onRemove={() => handleLocalRemove(m.festivalId)}
                  />
                ))}
              </div>
            )}

            {availableFestivals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Ajouter un accès</p>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={addFestivalId}
                    onChange={e => setAddFestivalId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 bg-white text-gray-900 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">— Festival —</option>
                    {[...availableFestivals].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleLocalAdd}
                    disabled={!addFestivalId || saving}
                    className="p-1.5 rounded-lg bg-accent text-white hover:opacity-80 transition-opacity disabled:opacity-40"
                    title="Ajouter"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Rôle :</span>
                  {ROLES.map(r => {
                    const rc = ROLE_CONFIG[r]
                    const isSelected = addFestivalRole === r
                    return (
                      <button
                        key={r}
                        onClick={() => setAddFestivalRole(r)}
                        className="badge border transition-opacity"
                        style={{
                          backgroundColor: isSelected ? rc.bg : 'transparent',
                          color: rc.text,
                          borderColor: rc.border,
                          opacity: isSelected ? 1 : 0.5,
                        }}
                      >
                        {rc.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} />
                Supprimer l'utilisateur
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Supprimer définitivement ?</span>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {saving ? '…' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs"
                >
                  Annuler
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendReset}
                disabled={saving || !user.email || user.email === '—'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors disabled:opacity-40"
                title="Envoie un email avec un lien de réinitialisation"
              >
                <Mail size={14} />
                Reset mdp
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Enregistrement…' : 'Valider'}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

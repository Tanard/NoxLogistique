import { useState, useEffect, useRef } from 'react'
import { Modal } from '../components/ui/Modal'
import { ErrorBlock } from '../components/ui/ErrorBlock'
import { parseError } from '../lib/errors'
import { ROLE_CONFIG, POLES } from '../constants'
import { Trash2, Plus, Mail, UserCircle2, X } from 'lucide-react'

const ALL_ROLES    = ['super_admin', 'admin', 'pole_manager', 'utilisateur']
const SCOPED_ROLES = ['utilisateur']

const MODULE_OPTIONS = [
  { id: 'general',  label: 'Liste des Besoins' },
  { id: 'todo',     label: 'Todo' },
  { id: 'map',      label: 'Carte technique' },
  { id: 'planning', label: 'Planning' },
]

const MODULE_LEVELS = [
  { value: 'view',  label: 'Voir' },
  { value: 'edit',  label: 'Modifier' },
]

function MembershipRow({ membership, availableRoles, onRoleChange, onRemove, onPolesChange, onModulePermChange, saving }) {
  const rc = ROLE_CONFIG[membership.role] ?? ROLE_CONFIG.viewer
  const isScoped = SCOPED_ROLES.includes(membership.role)

  const togglePole = (pole) => {
    const current = membership.poles ?? []
    const next = current.includes(pole) ? current.filter(p => p !== pole) : [...current, pole]
    onPolesChange(next.length > 0 ? next : null)
  }

  const setModuleLevel = (moduleId, level) => {
    const current = { ...(membership.modulePermissions ?? {}) }
    if (!level) { delete current[moduleId] } else { current[moduleId] = level }
    onModulePermChange(current)
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between gap-3 py-2.5">
        <span className="text-sm text-gray-900 flex-1 truncate">{membership.festivalName}</span>
        <select
          value={membership.role}
          onChange={e => onRoleChange(e.target.value)}
          disabled={saving}
          className="rounded-lg border text-xs px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40"
          style={{ borderColor: rc.border, color: rc.text, backgroundColor: rc.bg }}
        >
          {availableRoles.map(r => (
            <option key={r} value={r} style={{ backgroundColor: '#fff', color: '#111' }}>{ROLE_CONFIG[r].label}</option>
          ))}
        </select>
        <button onClick={onRemove} disabled={saving} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40" title="Retirer">
          <X size={14} />
        </button>
      </div>

      {isScoped && (
        <div className="pb-3 pl-1 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Pôles</p>
            <div className="flex flex-wrap gap-1.5">
              {POLES.map(pole => {
                const checked = membership.poles ? membership.poles.includes(pole.label) : false
                return (
                  <label key={pole.label} className="flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded-lg border transition-colors"
                    style={{ borderColor: checked ? pole.color : '#E5E7EB', backgroundColor: checked ? pole.color + '25' : 'transparent', color: checked ? pole.color : '#374151' }}>
                    <input type="checkbox" checked={checked} onChange={() => togglePole(pole.label)} className="sr-only" />
                    {pole.label}
                  </label>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Modules</p>
            <div className="space-y-1.5">
              {MODULE_OPTIONS.map(mod => {
                const level = (membership.modulePermissions ?? {})[mod.id] ?? ''
                return (
                  <div key={mod.id} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-700 flex-1">{mod.label}</span>
                    <div className="flex gap-1">
                      {MODULE_LEVELS.map(lv => (
                        <button key={lv.value} onClick={() => setModuleLevel(mod.id, lv.value)}
                          className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                          style={{
                            borderColor: level === lv.value ? (lv.value === 'edit' ? '#0284C7' : lv.value === 'view' ? '#7C3AED' : '#6B7280') : '#E5E7EB',
                            backgroundColor: level === lv.value ? (lv.value === 'edit' ? '#0284C715' : lv.value === 'view' ? '#7C3AED15' : '#6B728015') : 'transparent',
                            color: level === lv.value ? (lv.value === 'edit' ? '#0284C7' : lv.value === 'view' ? '#7C3AED' : '#6B7280') : '#9CA3AF',
                          }}>
                          {lv.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ModalUser({
  open, onClose, mode = 'edit',
  isAdmin, canManageRole,
  user, festivals = [],
  updateRole, addMembership, updateMembershipDetails, removeMembership, deleteUser, sendPasswordReset,
  onSaved, createUser, showToast,
}) {
  const [createForm, setCreateForm] = useState({ email: '', firstName: '', lastName: '', festivalId: '', festivalRole: 'utilisateur' })
  const [createError, setCreateError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [localMemberships, setLocalMemberships] = useState([])
  const originalRef = useRef([])
  const [addFestivalId, setAddFestivalId]     = useState('')
  const [addFestivalRole, setAddFestivalRole] = useState('utilisateur')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const availableRoles = ALL_ROLES.filter(r => {
    if (!canManageRole) return !['super_admin', 'admin'].includes(r)
    return canManageRole(r, user?.id ?? null) !== false
  })

  useEffect(() => {
    if (!open) return
    setCreateForm({ email: '', firstName: '', lastName: '', festivalId: '', festivalRole: 'utilisateur' })
    setCreateError(null)
    setConfirmDelete(false)
    setAddFestivalId('')
    setAddFestivalRole('utilisateur')
    if (user) {
      const copy = (user.memberships ?? []).map(m => ({ ...m }))
      setLocalMemberships(copy)
      originalRef.current = copy
    }
  }, [open, user])

  const alreadyIn = new Set(localMemberships.map(m => m.festivalId))
  const availableFestivals = festivals.filter(f => !alreadyIn.has(f.id))

  const handleLocalRoleChange    = (festivalId, r)  => setLocalMemberships(prev => prev.map(m => m.festivalId === festivalId ? { ...m, role: r }    : m))
  const handleLocalPolesChange      = (festivalId, p)  => setLocalMemberships(prev => prev.map(m => m.festivalId === festivalId ? { ...m, poles: p }             : m))
  const handleLocalModulePermChange = (festivalId, mp) => setLocalMemberships(prev => prev.map(m => m.festivalId === festivalId ? { ...m, modulePermissions: mp } : m))
  const handleLocalRemove        = (festivalId)     => setLocalMemberships(prev => prev.filter(m => m.festivalId !== festivalId))

  const handleLocalAdd = () => {
    if (!addFestivalId) return
    const festivalName = festivals.find(f => f.id === addFestivalId)?.name ?? '—'
    setLocalMemberships(prev => [...prev, { festivalId: addFestivalId, festivalName, role: addFestivalRole, poles: null, modulePermissions: {} }])
    setAddFestivalId('')
    setAddFestivalRole('viewer')
  }

  const handleCreate = async () => {
    const { email, firstName, lastName, festivalId, festivalRole } = createForm
    if (!email.trim()) return setCreateError({ message: "L'email est obligatoire.", code: null })
    if (!firstName.trim()) return setCreateError({ message: 'Le prénom est obligatoire.', code: null })
    if (!lastName.trim()) return setCreateError({ message: 'Le nom est obligatoire.', code: null })
    setCreateError(null)
    setSaving(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      const { data, error } = await createUser({ email: email.trim().toLowerCase(), fullName })
      if (error) {
        setCreateError(parseError(error))
        showToast?.('Erreur lors de l\'envoi de l\'invitation', 'error')
      } else {
        if (festivalId && data?.user?.id) {
          await addMembership(data.user.id, festivalId, festivalRole)
        }
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
          const { error } = await addMembership(user.id, m.festivalId, m.role, m.poles, m.modulePermissions)
          if (error) hasError = true
        }
      }

      for (const m of current) {
        const orig = original.find(o => o.festivalId === m.festivalId)
        if (orig) {
          if (orig.role !== m.role) {
            const { error } = await updateRole(user.id, m.festivalId, m.role)
            if (error) hasError = true
          }
          const polesChanged   = JSON.stringify(orig.poles)             !== JSON.stringify(m.poles)
          const modulesChanged = JSON.stringify(orig.modulePermissions) !== JSON.stringify(m.modulePermissions)
          if ((polesChanged || modulesChanged) && updateMembershipDetails) {
            const { error } = await updateMembershipDetails(user.id, m.festivalId, { poles: m.poles, modulePermissions: m.modulePermissions })
            if (error) hasError = true
          }
        }
      }

      if (hasError) showToast?.('Certaines modifications n\'ont pas pu être enregistrées', 'error')
      else showToast?.('Modifications enregistrées', 'success')

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

  return (
    <Modal open={open} onClose={onClose} onConfirm={mode === 'create' ? handleCreate : handleSave} title={mode === 'create' ? 'Créer un utilisateur' : 'Détail utilisateur'}>

      {mode === 'create' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Un email d'invitation sera envoyé. L'invité clique sur le lien, choisit son mot de passe et son compte est activé immédiatement.</p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="prenom.nom@entreprise.com" className="input-light" autoFocus />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Prénom *</label>
              <input type="text" value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Prénom" className="input-light" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input type="text" value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} placeholder="NOM" className="input-light" />
            </div>
          </div>
          {festivals.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Festival</label>
              <select value={createForm.festivalId} onChange={e => setCreateForm(f => ({ ...f, festivalId: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">— Aucun —</option>
                {[...festivals].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
          {createForm.festivalId && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rôle</label>
              <select
                value={createForm.festivalRole}
                onChange={e => setCreateForm(f => ({ ...f, festivalRole: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {availableRoles.map(r => (
                  <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                ))}
              </select>
            </div>
          )}
          <ErrorBlock message={createError?.message} code={createError?.code} />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Annuler</button>
            <button onClick={handleCreate} disabled={saving} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
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
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Accès festivals</h3>
            {localMemberships.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Aucun accès festival attribué</p>
            ) : (
              <div>
                {localMemberships.map(m => (
                  <MembershipRow
                    key={m.festivalId}
                    membership={m}
                    availableRoles={availableRoles}
                    saving={saving}
                    onRoleChange={r  => handleLocalRoleChange(m.festivalId, r)}
                    onPolesChange={p => handleLocalPolesChange(m.festivalId, p)}
                    onModulePermChange={mp => handleLocalModulePermChange(m.festivalId, mp)}
                    onRemove={() => handleLocalRemove(m.festivalId)}
                  />
                ))}
              </div>
            )}

            {availableFestivals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Ajouter un accès</p>
                <div className="flex items-center gap-2 mb-2">
                  <select value={addFestivalId} onChange={e => setAddFestivalId(e.target.value)} className="flex-1 rounded-lg border border-gray-200 bg-white text-gray-900 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="">— Festival —</option>
                    {[...availableFestivals].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <button onClick={handleLocalAdd} disabled={!addFestivalId || saving} className="p-1.5 rounded-lg bg-accent text-white hover:opacity-80 transition-opacity disabled:opacity-40" title="Ajouter">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">Rôle :</span>
                  {availableRoles.map(r => {
                    const rc = ROLE_CONFIG[r]
                    const isSelected = addFestivalRole === r
                    return (
                      <button key={r} onClick={() => setAddFestivalRole(r)} className="badge border transition-opacity"
                        style={{ backgroundColor: isSelected ? rc.bg : 'transparent', color: rc.text, borderColor: rc.border, opacity: isSelected ? 1 : 0.5 }}>
                        {rc.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {isAdmin && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40">
                  <Trash2 size={14} /> Supprimer l'utilisateur
                </button>
              )}
              {isAdmin && confirmDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600">Supprimer définitivement ?</span>
                  <button onClick={handleDelete} disabled={saving} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50">{saving ? '…' : 'Confirmer'}</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs">Annuler</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSendReset} disabled={saving || !user.email || user.email === '—'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors disabled:opacity-40" title="Envoie un email de réinitialisation">
                <Mail size={14} /> Reset mdp
              </button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Enregistrement…' : 'Valider'}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

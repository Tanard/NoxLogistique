import { useState, useEffect, useRef } from 'react'
import { Modal } from '../components/ui/Modal'
import { PasswordInput } from '../components/ui/PasswordInput'
import { ROLE_CONFIG } from '../constants'
import { COLORS } from '../constants'
import { Trash2, Plus, Mail, UserCircle2, X } from 'lucide-react'

const ROLES = ['admin', 'pole_manager', 'viewer']

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant : ligne d'une appartenance festival
// Travaille sur les données locales (pas de DB avant Valider)
// ─────────────────────────────────────────────────────────────────────────────
function MembershipRow({ membership, onRoleChange, onRemove, saving }) {
  const rc = ROLE_CONFIG[membership.role] ?? ROLE_CONFIG.viewer

  const cycleRole = () => {
    const idx = ROLES.indexOf(membership.role)
    const nextRole = ROLES[(idx + 1) % ROLES.length]
    onRoleChange(nextRole)
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white flex-1 truncate">{membership.festivalName}</span>
      <button
        onClick={cycleRole}
        disabled={saving}
        className="px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:opacity-80 disabled:opacity-40"
        style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}
        title="Cliquez pour changer le rôle"
      >
        {rc.label}
      </button>
      <button
        onClick={onRemove}
        disabled={saving}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
        title="Retirer de ce festival"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal principale
// ─────────────────────────────────────────────────────────────────────────────
export function ModalUser({
  open, onClose, mode = 'edit',
  user, festivals = [],
  // Opérations edit (mutations pures — pas de reload interne)
  updateRole, addMembership, removeMembership, deleteUser, sendPasswordReset,
  // Appelé après sauvegarde réussie — AdminPage fait le reload + sync
  onSaved,
  // Opération create
  createUser,
  showToast,
}) {
  // ── État formulaire création ───────────────────────────────────────────────
  const [createForm, setCreateForm] = useState({ email: '', password: '', fullName: '' })
  const [createError, setCreateError] = useState('')
  const [saving, setSaving] = useState(false)

  // ── État local des memberships (mode edit) ─────────────────────────────────
  // Toutes les modifications (rôle, ajout, retrait) restent locales
  // jusqu'au clic sur "Valider" — aucune requête DB avant ce moment.
  const [localMemberships, setLocalMemberships] = useState([])
  const originalRef = useRef([])  // snapshot au moment de l'ouverture pour le diff

  // ── État ajout festival ────────────────────────────────────────────────────
  const [addFestivalId, setAddFestivalId]     = useState('')
  const [addFestivalRole, setAddFestivalRole] = useState('viewer')

  // ── État confirmation suppression ─────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Reset complet à chaque ouverture / changement d'utilisateur
  useEffect(() => {
    if (open) {
      setCreateForm({ email: '', password: '', fullName: '' })
      setCreateError('')
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

  // Festivals disponibles pour l'ajout (basé sur l'état local, pas la DB)
  const alreadyIn = new Set(localMemberships.map(m => m.festivalId))
  const availableFestivals = festivals.filter(f => !alreadyIn.has(f.id))

  // ── Mutations locales (pas de DB) ──────────────────────────────────────────
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

  // ── Mode création ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    const { email, password, fullName } = createForm
    if (!email.trim()) return setCreateError('L\'email est obligatoire.')
    if (!password || password.length < 6) return setCreateError('Le mot de passe doit faire au moins 6 caractères.')
    setCreateError('')
    setSaving(true)
    try {
      const { error } = await createUser({ email: email.trim().toLowerCase(), password, fullName: fullName.trim() || null })
      if (error) {
        setCreateError(error.message ?? 'Erreur lors de la création.')
        showToast?.('Erreur lors de la création de l\'utilisateur', 'error')
      } else {
        showToast?.('Utilisateur créé avec succès', 'success')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Mode édition : sauvegarde diff au clic "Valider" ──────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const original = originalRef.current
      const current  = localMemberships
      let hasError   = false

      // Festivals retirés
      for (const m of original) {
        if (!current.find(c => c.festivalId === m.festivalId)) {
          const { error } = await removeMembership(user.id, m.festivalId)
          if (error) hasError = true
        }
      }

      // Festivals ajoutés
      for (const m of current) {
        if (!original.find(o => o.festivalId === m.festivalId)) {
          const { error } = await addMembership(user.id, m.festivalId, m.role)
          if (error) hasError = true
        }
      }

      // Rôles modifiés
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

      onSaved?.(user.id)  // AdminPage recharge la liste et re-sync l'utilisateur sélectionné
      onClose()
    } finally {
      setSaving(false)
    }
  }

  // ── Suppression immédiate (action irréversible, pas de "Valider") ──────────
  const handleDelete = async () => {
    setSaving(true)
    try {
      const { error } = await deleteUser(user.id)
      if (error) showToast?.('Erreur lors de la suppression', 'error')
      else showToast?.('Utilisateur supprimé', 'success')
    } finally {
      setSaving(false)
    }
  }

  // ── Reset mot de passe (action immédiate) ──────────────────────────────────
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
    <Modal open={open} onClose={onClose} title={title}>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODE CRÉATION                                                       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'create' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            L'utilisateur sera créé avec l'email confirmé et pourra se connecter immédiatement.
            Il sera automatiquement ajouté au festival par défaut en tant que Viewer.
          </p>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Email *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              placeholder="prenom.nom@email.com"
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Nom complet (optionnel)</label>
            <input
              type="text"
              value={createForm.fullName}
              onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Prénom Nom"
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Mot de passe *</label>
            <PasswordInput
              value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              placeholder="6 caractères minimum"
              autoComplete="new-password"
            />
          </div>

          {createError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{createError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: COLORS.accent }}
            >
              {saving ? 'Création…' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MODE ÉDITION                                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {mode === 'edit' && user && (
        <>
          {/* ── Identité ── */}
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: COLORS.accent + '30' }}
              >
                <UserCircle2 size={22} style={{ color: COLORS.accent }} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{user.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* ── Accès festivals (état local) ── */}
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Accès festivals
            </h3>

            {localMemberships.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-2">Aucun accès festival attribué</p>
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

            {/* Ajouter un festival */}
            {availableFestivals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2 font-medium">Ajouter un accès</p>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={addFestivalId}
                    onChange={e => setAddFestivalId(e.target.value)}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 text-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    <option value="" className="bg-gray-900">— Festival —</option>
                    {availableFestivals.map(f => (
                      <option key={f.id} value={f.id} className="bg-gray-900">{f.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleLocalAdd}
                    disabled={!addFestivalId || saving}
                    className="p-1.5 rounded-lg text-white hover:opacity-80 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: COLORS.accent }}
                    title="Ajouter"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Rôle :</span>
                  {ROLES.map(r => {
                    const rc = ROLE_CONFIG[r]
                    const isSelected = addFestivalRole === r
                    return (
                      <button
                        key={r}
                        onClick={() => setAddFestivalRole(r)}
                        className="px-2 py-1 rounded-full text-xs font-semibold border transition-all"
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

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {/* Suppression (immédiate et irréversible) */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                <Trash2 size={14} />
                Supprimer l'utilisateur
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Supprimer définitivement ?</span>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {saving ? '…' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Reset mot de passe (immédiat) + Valider (enregistre tout) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendReset}
                disabled={saving || !user.email || user.email === '—'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                style={{ color: COLORS.accent, backgroundColor: COLORS.accent + '15' }}
                title="Envoie un email avec un lien de réinitialisation"
              >
                <Mail size={14} />
                Reset mdp
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.accent }}
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

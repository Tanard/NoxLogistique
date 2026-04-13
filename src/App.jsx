import { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  Plus,
  X,
  Menu,
  Users,
  UtensilsCrossed,
  Music,
  ShieldCheck,
  Truck,
  Pencil,
  Search,
  ClipboardList,
  ChevronUp,
  ChevronDown,
  Trash2,
  Lock,
  LogOut,
} from 'lucide-react'

/* ─── Constantes ─── */
const COLORS = {
  sidebar: '#1E1B2E',
  card: '#3D2C5E',
  accent: '#7C3AED',
  bg: '#F8F7FC',
  textDark: '#2D2B3A',
}

const POLES = [
  { label: 'Bénévole', icon: Users, color: '#8B5CF6' },
  { label: 'Restauration', icon: UtensilsCrossed, color: '#F472B6' },
  { label: 'Artiste', icon: Music, color: '#FB923C' },
  { label: 'Sécurité', icon: ShieldCheck, color: '#34D399' },
  { label: 'Logistique', icon: Truck, color: '#60A5FA' },
]

const STATUTS = [
  { label: 'En attente', bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  { label: 'Validé', bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
  { label: 'Annulé', bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
]

const ADMIN_ACCOUNTS = [
  { username: 'admin', code: 'nox2026' },
  { username: 'logistique', code: 'logis2026' },
]

const NAV_ITEMS = [
  { label: 'Général', icon: LayoutDashboard, id: 'general' },
  // Ajouter d'autres onglets ici :
  // { label: 'Planning', icon: Calendar, id: 'planning' },
]

const SAMPLE_DATA = [
  { id: 1, pole: 'Bénévole', date: '2026-04-10', designation: 'Talkies-walkies', quantite: 20, caracteristique: 'Portée 5km minimum', usage: 'Communication entre les équipes sur le site', statut: 'En attente', longueur: '', largeur: '', hauteur: '', electricite: 'Non', electriciteDetail: '', eau: 'Non', eauDetail: '' },
  { id: 2, pole: 'Restauration', date: '2026-04-09', designation: 'Tables pliantes 180cm', quantite: 15, caracteristique: 'Résistantes, pieds réglables', usage: 'Service restauration zone VIP', statut: 'Validé', longueur: '180', largeur: '75', hauteur: '74', electricite: 'Oui', electriciteDetail: '2 prises 220V par table pour réchauds', eau: 'Oui', eauDetail: "Point d'eau à proximité pour lavage" },
  { id: 3, pole: 'Artiste', date: '2026-04-08', designation: 'Loges climatisées', quantite: 4, caracteristique: 'Algeco 20m² avec clim réversible', usage: 'Loges artistes backstage', statut: 'En attente', longueur: '600', largeur: '300', hauteur: '280', electricite: 'Oui', electriciteDetail: '32A triphasé pour climatisation', eau: 'Non', eauDetail: '' },
  { id: 4, pole: 'Sécurité', date: '2026-04-07', designation: 'Barrières Vauban', quantite: 120, caracteristique: 'Acier galvanisé 2m', usage: 'Délimitation fosse et accès scènes', statut: 'Validé', longueur: '200', largeur: '5', hauteur: '110', electricite: 'Non', electriciteDetail: '', eau: 'Non', eauDetail: '' },
  { id: 5, pole: 'Logistique', date: '2026-04-06', designation: 'Groupe électrogène 100kVA', quantite: 2, caracteristique: 'Diesel, insonorisé', usage: 'Alimentation scène principale et son', statut: 'Annulé', longueur: '250', largeur: '120', hauteur: '150', electricite: 'Oui', electriciteDetail: 'Raccordement TGBT principal', eau: 'Non', eauDetail: '' },
  { id: 6, pole: 'Bénévole', date: '2026-04-11', designation: 'Gilets haute visibilité', quantite: 50, caracteristique: 'Jaune fluo, taille unique', usage: 'Identification des bénévoles sur site', statut: 'En attente', longueur: '', largeur: '', hauteur: '', electricite: 'Non', electriciteDetail: '', eau: 'Non', eauDetail: '' },
]

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ─── Badge Pôle ─── */
function PoleBadge({ pole }) {
  const p = POLES.find(x => x.label === pole)
  if (!p) return <span>{pole}</span>
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: p.color }}
    >
      <p.icon size={13} />
      {p.label}
    </span>
  )
}

/* ─── Badge Statut ─── */
function StatutBadge({ statut }) {
  const s = STATUTS.find(x => x.label === statut)
  if (!s) return <span>{statut}</span>
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

/* ─── Modal wrapper ─── */
function Modal({ open, onClose, children, title }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 md:p-8"
        style={{ backgroundColor: COLORS.card }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── Modal Login Gestion ─── */
function ModalLogin({ open, onClose, onLogin }) {
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    const account = ADMIN_ACCOUNTS.find(a => a.username === username.trim().toLowerCase() && a.code === code)
    if (account) {
      onLogin(account.username)
      setUsername(''); setCode(''); setError('')
      onClose()
    } else {
      setError('Identifiants incorrects')
    }
  }

  return (
    <Modal open={open} onClose={() => { setError(''); onClose() }} title="Accès Gestion">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nom d'utilisateur</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Identifiant" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
          <input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="Code d'accès" onKeyDown={e => e.key === 'Enter' && handleLogin()} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors">Annuler</button>
        <button onClick={handleLogin} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: COLORS.accent }}>Connexion</button>
      </div>
    </Modal>
  )
}

/* ─── Modal Nouveau Besoin ─── */
function ModalNouveau({ open, onClose, onSave }) {
  const [form, setForm] = useState({ pole: POLES[0].label, designation: '', quantite: '', caracteristique: '', usage: '' })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = () => {
    if (!form.designation.trim() || !form.quantite) return
    onSave({
      ...form,
      quantite: Number(form.quantite),
      date: todayISO(),
      statut: 'En attente',
      longueur: '', largeur: '', hauteur: '',
      electricite: 'Non', electriciteDetail: '',
      eau: 'Non', eauDetail: '',
    })
    setForm({ pole: POLES[0].label, designation: '', quantite: '', caracteristique: '', usage: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouveau Besoin">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Pôle</label>
          <select value={form.pole} onChange={e => set('pole', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
            {POLES.map(p => <option key={p.label} value={p.label} className="bg-gray-800">{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Désignation du besoin *</label>
          <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Ex : Tables pliantes" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Quantité *</label>
          <input type="number" min="1" value={form.quantite} onChange={e => set('quantite', e.target.value)} placeholder="0" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Caractéristique technique</label>
          <textarea value={form.caracteristique} onChange={e => set('caracteristique', e.target.value)} rows={2} placeholder="Détails techniques..." className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Usage prévu</label>
          <textarea value={form.usage} onChange={e => set('usage', e.target.value)} rows={2} placeholder="À quoi cela servira-t-il ?" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
        <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors">Annuler</button>
        <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: COLORS.accent }}>Valider</button>
      </div>
    </Modal>
  )
}

/* ─── Modal Détail du Besoin ─── */
function ModalDetail({ open, onClose, besoin, onUpdate, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(besoin || {})

  const resetForm = (b) => { setForm({ ...b }); setEditing(false) }
  if (besoin && form.id !== besoin.id) resetForm(besoin)

  if (!besoin) return null

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const cycleStatut = () => {
    const idx = STATUTS.findIndex(s => s.label === form.statut)
    set('statut', STATUTS[(idx + 1) % STATUTS.length].label)
  }

  const handleSave = () => {
    onUpdate(form)
    setEditing(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { resetForm(besoin); onClose() }} title="Détail du besoin">
      {/* Section 1 : Récapitulatif demandeur */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Demande</h3>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-white"
            style={{ backgroundColor: COLORS.accent }}
          >
            <Pencil size={12} />
            {editing ? 'Verrouiller' : 'Modifier'}
          </button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Pôle</label>
              <select value={form.pole} onChange={e => set('pole', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
                {POLES.map(p => <option key={p.label} value={p.label} className="bg-gray-800">{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Désignation</label>
              <input type="text" value={form.designation} onChange={e => set('designation', e.target.value)} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Quantité</label>
                <input type="number" min="1" value={form.quantite} onChange={e => set('quantite', Number(e.target.value))} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input type="text" value={formatDate(form.date)} disabled className="w-full rounded-lg border border-white/10 bg-white/5 text-gray-400 px-3 py-2 text-sm cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Caractéristique technique</label>
              <textarea value={form.caracteristique} onChange={e => set('caracteristique', e.target.value)} rows={2} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Usage prévu</label>
              <textarea value={form.usage} onChange={e => set('usage', e.target.value)} rows={2} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="text-gray-400">Pôle :</span> <span className="text-white ml-1"><PoleBadge pole={form.pole} /></span></div>
            <div className="flex items-center justify-between"><span><span className="text-gray-400">Date :</span> <span className="text-white ml-1">{formatDate(form.date)}</span></span> <button onClick={cycleStatut} className="cursor-pointer transition-all" title="Cliquez pour changer le statut"><StatutBadge statut={form.statut} /></button></div>
            <div className="col-span-2"><span className="text-gray-400">Désignation :</span> <span className="text-white ml-1">{form.designation}</span></div>
            <div><span className="text-gray-400">Quantité :</span> <span className="text-white ml-1">{form.quantite}</span></div>
            {form.caracteristique && <div className="col-span-2"><span className="text-gray-400">Caractéristique :</span> <span className="text-white ml-1">{form.caracteristique}</span></div>}
            {form.usage && <div className="col-span-2"><span className="text-gray-400">Usage :</span> <span className="text-white ml-1">{form.usage}</span></div>}
          </div>
        )}
      </div>

      {/* Section 2 : Infos logistique (admin only) */}
      {isAdmin && (
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Informations logistique</h3>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Transport</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[['longueur', 'Longueur (cm)'], ['largeur', 'Largeur (cm)'], ['hauteur', 'Hauteur (cm)']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="—" className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" />
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dimensionnement</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Électricité</label>
              <select value={form.electricite} onChange={e => { set('electricite', e.target.value); if (e.target.value === 'Non') set('electriciteDetail', '') }} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
                <option value="Non" className="bg-gray-800">Non</option>
                <option value="Oui" className="bg-gray-800">Oui</option>
              </select>
              {form.electricite === 'Oui' && (
                <textarea value={form.electriciteDetail} onChange={e => set('electriciteDetail', e.target.value)} rows={2} placeholder="Précisez le besoin électrique..." className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Eau</label>
              <select value={form.eau} onChange={e => { set('eau', e.target.value); if (e.target.value === 'Non') set('eauDetail', '') }} className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
                <option value="Non" className="bg-gray-800">Non</option>
                <option value="Oui" className="bg-gray-800">Oui</option>
              </select>
              {form.eau === 'Oui' && (
                <textarea value={form.eauDetail} onChange={e => set('eauDetail', e.target.value)} rows={2} placeholder="Précisez le besoin en eau..." className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {isAdmin ? (
          <button onClick={() => { onDelete(besoin.id); onClose() }} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/15 transition-colors">
            <Trash2 size={14} />
            Supprimer
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <button onClick={() => { resetForm(besoin); onClose() }} className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors">Fermer</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: COLORS.accent }}>Valider</button>
        </div>
      </div>
    </Modal>
  )
}

/* ─── App ─── */
export default function App() {
  const [besoins, setBesoins] = useState(SAMPLE_DATA)
  const [activeNav, setActiveNav] = useState('general')
  const [showNew, setShowNew] = useState(false)
  const [selectedBesoin, setSelectedBesoin] = useState(null)
  const [filterPole, setFilterPole] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [adminUser, setAdminUser] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const isAdmin = !!adminUser

  const counts = useMemo(() => {
    const map = {}
    POLES.forEach(p => { map[p.label] = 0 })
    besoins.forEach(b => { if (map[b.pole] !== undefined) map[b.pole]++ })
    return map
  }, [besoins])

  const SORT_KEYS = { 'Pôle': 'pole', 'Date': 'date', 'Désignation': 'designation', 'Quantité': 'quantite', 'Usage prévu': 'usage', 'Statut': 'statut' }

  const handleSort = (header) => {
    const key = SORT_KEYS[header]
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let list = besoins.filter(b => {
      if (filterPole && b.pole !== filterPole) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return b.designation.toLowerCase().includes(q) || b.usage.toLowerCase().includes(q) || b.pole.toLowerCase().includes(q)
      }
      return true
    })
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey]
        if (sortKey === 'quantite') { va = Number(va); vb = Number(vb) }
        else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase() }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return list
  }, [besoins, filterPole, searchQuery, sortKey, sortDir])

  const addBesoin = (data) => {
    setBesoins(prev => [{ ...data, id: Date.now() }, ...prev])
  }

  const updateBesoin = (updated) => {
    setBesoins(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  const deleteBesoin = (id) => {
    setBesoins(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg"
        style={{ backgroundColor: COLORS.sidebar }}
      >
        <Menu size={22} />
      </button>

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 flex-shrink-0 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: COLORS.sidebar }}
      >
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-white tracking-wide">Nox Logistique</h1>
          <p className="text-xs text-gray-500 mt-0.5">Festival Management</p>
        </div>
        <nav className="flex-1 px-3 mt-4">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${activeNav === item.id ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
              style={activeNav === item.id ? { backgroundColor: COLORS.accent + '20', color: '#fff', borderLeft: `3px solid ${COLORS.accent}` } : {}}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 text-xs text-gray-600">v1.0</div>
      </aside>

      {/* ZONE PRINCIPALE */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: COLORS.bg }}>
        <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">

          {/* Barre du haut avec bouton Gestion */}
          <div className="flex justify-end mb-4">
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                  <span className="text-gray-500">Connecté :</span> {adminUser}
                </span>
                <button
                  onClick={() => setAdminUser(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COLORS.sidebar }}
              >
                <Lock size={15} />
                Gestion
              </button>
            )}
          </div>

          {/* Cartes résumé */}
          <div className="flex gap-4 overflow-x-auto pb-2 mb-3">
            <button
              onClick={() => setFilterPole(null)}
              className="flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[180px] transition-all cursor-pointer hover:scale-[1.02]"
              style={{
                backgroundColor: COLORS.card,
                borderLeft: `3px solid ${COLORS.accent}`,
                outline: filterPole === null ? `2px solid ${COLORS.accent}` : 'none',
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.accent + '22' }}>
                <ClipboardList size={20} style={{ color: COLORS.accent }} />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400 whitespace-nowrap">Besoin</p>
                <p className="text-2xl font-bold text-white">{besoins.length}</p>
              </div>
            </button>
            {POLES.map(pole => {
              const active = filterPole === pole.label
              return (
                <button
                  key={pole.label}
                  onClick={() => setFilterPole(active ? null : pole.label)}
                  className="flex-shrink-0 flex items-center gap-3 rounded-xl p-4 min-w-[180px] transition-all cursor-pointer hover:scale-[1.02]"
                  style={{
                    backgroundColor: COLORS.card,
                    borderLeft: `3px solid ${pole.color}`,
                    outline: active ? `2px solid ${pole.color}` : 'none',
                  }}
                >
                  <div className="p-2 rounded-lg" style={{ backgroundColor: pole.color + '22' }}>
                    <pole.icon size={20} style={{ color: pole.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{pole.label}</p>
                    <p className="text-2xl font-bold text-white">{counts[pole.label]}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Header tableau */}
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2" style={{ color: COLORS.textDark }}>
              Besoins {filterPole && <span className="text-sm font-normal text-gray-500">— {filterPole}</span>}
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ backgroundColor: COLORS.accent }}
              >
                <Plus size={18} />
                Nouveau Besoin
              </button>
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un besoin..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                  style={{ color: COLORS.textDark }}
                />
              </div>
            </div>
          </div>

          {/* Tableau desktop */}
          <div className="hidden md:block rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2D2650' }}>
                  {['Pôle', 'Date', 'Désignation', 'Quantité', 'Statut'].map(h => (
                    <th
                      key={h}
                      onClick={() => handleSort(h)}
                      className="text-left text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 py-2.5 cursor-pointer select-none hover:text-white transition-colors"
                    >
                      <span className="inline-flex items-center gap-1">
                        {h}
                        {sortKey === SORT_KEYS[h] && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBesoin(b)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                    style={i % 2 === 0 ? {} : { backgroundColor: '#FAFAF8' }}
                  >
                    <td className="px-4 py-1.5"><PoleBadge pole={b.pole} /></td>
                    <td className="px-4 py-1.5" style={{ color: COLORS.textDark }}>{formatDate(b.date)}</td>
                    <td className="px-4 py-1.5 font-medium" style={{ color: COLORS.textDark }}>{b.designation}</td>
                    <td className="px-4 py-1.5 text-center" style={{ color: COLORS.textDark }}>{b.quantite}</td>
                    <td className="px-4 py-1.5"><StatutBadge statut={b.statut} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Aucun besoin trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map(b => (
              <div
                key={b.id}
                onClick={() => setSelectedBesoin(b)}
                className="rounded-xl p-4 shadow-sm cursor-pointer active:scale-[0.98] transition-transform bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <PoleBadge pole={b.pole} />
                  <StatutBadge statut={b.statut} />
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: COLORS.textDark }}>{b.designation}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(b.date)}</span>
                  <span>Qté : {b.quantite}</span>
                </div>
                {b.usage && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{b.usage}</p>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">Aucun besoin trouvé</div>
            )}
          </div>
        </div>
      </main>

      {/* Modales */}
      <ModalNouveau open={showNew} onClose={() => setShowNew(false)} onSave={addBesoin} />
      <ModalDetail
        open={!!selectedBesoin}
        onClose={() => setSelectedBesoin(null)}
        besoin={selectedBesoin}
        onUpdate={updateBesoin}
        onDelete={deleteBesoin}
        isAdmin={isAdmin}
      />
      <ModalLogin
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={setAdminUser}
      />
    </div>
  )
}

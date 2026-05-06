import { useState } from 'react'
import { PasswordInput } from '../components/ui/PasswordInput'
import { ErrorBlock } from '../components/ui/ErrorBlock'
import { parseError } from '../lib/errors'

function RegisterForm({ onBack, onSignUp }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError(null); setSuccess('')
    if (!fullName.trim()) { setError({ message: 'Nom complet requis.', code: null }); return }
    if (!email.trim()) { setError({ message: 'Email requis.', code: null }); return }
    if (!password || password.length < 6) { setError({ message: 'Mot de passe : 6 caractères minimum.', code: null }); return }
    if (password !== confirm) { setError({ message: 'Les mots de passe ne correspondent pas.', code: null }); return }

    setLoading(true)
    const { error: err } = await onSignUp(email, password, fullName)
    setLoading(false)

    if (err) {
      setError(parseError(err))
    } else {
      setSuccess('Compte créé ! Vérifie tes emails pour confirmer ton adresse.')
      setFullName(''); setEmail(''); setPassword(''); setConfirm('')
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Créer un compte</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Prénom Nom" className="input-light" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@exemple.com" autoComplete="email" className="input-light" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="6 caractères minimum" autoComplete="new-password" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
          <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Répéter le mot de passe" autoComplete="new-password" onKeyDown={e => e.key === 'Enter' && !loading && handleRegister()} />
        </div>
        <ErrorBlock message={error?.message} code={error?.code} />
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-2">
          Retour à la connexion
        </button>
        <button onClick={handleRegister} disabled={loading} className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Création…' : 'Créer'}
        </button>
      </div>
    </>
  )
}

export default function LoginPage({ onSignIn, onSignUp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogin = async () => {
    setError(null)
    if (!email.trim()) return setError({ message: 'Veuillez saisir votre email.', code: null })
    if (!password) return setError({ message: 'Veuillez saisir votre mot de passe.', code: null })
    setLoading(true)
    const { error: err } = await onSignIn(email, password)
    setLoading(false)
    if (err) setError(parseError(err))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-wide">Logisticore</h1>
        <p className="text-gray-500 mt-2 text-sm">Gestion logistique festival</p>
      </div>

      <div className="w-full max-w-md rounded-2xl p-8 bg-white border border-gray-200">
        {showRegister ? (
          <RegisterForm onBack={() => setShowRegister(false)} onSignUp={onSignUp} />
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Connexion</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  autoComplete="email"
                  onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
                  className="input-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <PasswordInput
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
                />
              </div>
              <ErrorBlock message={error?.message} code={error?.code} />
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowRegister(true)}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-2"
              >
                Créer un compte
              </button>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Connexion…' : 'Connexion'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

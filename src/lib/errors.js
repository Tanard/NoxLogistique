/**
 * Mapping centralisé des erreurs Supabase → messages lisibles en français.
 *
 * Chaque erreur retourne :
 *   - message : texte affiché à l'utilisateur (clair, sans jargon technique)
 *   - code    : identifiant court à partager pour diagnostic
 *
 * Usage :
 *   import { parseError } from '../lib/errors'
 *   const { message, code } = parseError(error)
 */

const AUTH_MAP = [
  { match: 'Invalid login credentials',        message: "Email ou mot de passe incorrect.",                                              code: 'AUTH_INVALID_CREDENTIALS' },
  { match: 'Email not confirmed',              message: "Votre email n'a pas encore été confirmé. Vérifiez votre boîte mail.",           code: 'AUTH_EMAIL_NOT_CONFIRMED' },
  { match: 'User already registered',          message: "Un compte existe déjà avec cet email.",                                         code: 'AUTH_USER_EXISTS' },
  { match: 'Password should be at least',      message: "Le mot de passe doit faire au moins 6 caractères.",                             code: 'AUTH_WEAK_PASSWORD' },
  { match: 'Unable to validate email address', message: "Adresse email invalide.",                                                        code: 'AUTH_INVALID_EMAIL' },
  { match: 'invalid format',                   message: "Adresse email invalide.",                                                        code: 'AUTH_INVALID_EMAIL' },
  { match: 'Email rate limit exceeded',        message: "Trop de tentatives. Réessayez dans quelques minutes.",                          code: 'AUTH_RATE_LIMITED' },
  { match: 'you can only request this after',  message: "Trop de tentatives. Réessayez dans quelques secondes.",                         code: 'AUTH_RATE_LIMITED' },
  { match: 'New password should be different', message: "Le nouveau mot de passe doit être différent de l'ancien.",                      code: 'AUTH_SAME_PASSWORD' },
  { match: 'Token has expired or is invalid',  message: "Lien expiré. Demandez un nouveau lien de connexion.",                           code: 'AUTH_LINK_EXPIRED' },
  { match: 'AuthSessionMissingError',          message: "Session expirée. Rechargez la page.",                                           code: 'AUTH_SESSION_MISSING' },
  // Edge Function admin-create-user
  { match: 'Forbidden',                        message: "Accès refusé : droits administrateur requis.",                                  code: 'INVITE_FORBIDDEN' },
  { match: 'Internal server error',            message: "Erreur serveur inattendue.",                                                     code: 'SERVER_ERROR' },
]

/**
 * Convertit une erreur Supabase (ou string) en objet { message, code }.
 * Toujours retourne quelque chose — jamais undefined.
 */
export function parseError(error) {
  if (!error) return { message: "Une erreur inattendue s'est produite.", code: 'UNKNOWN_ERROR' }

  const raw = typeof error === 'string'
    ? error
    : error.message ?? error.error_description ?? ''

  for (const entry of AUTH_MAP) {
    if (raw.includes(entry.match)) return { message: entry.message, code: entry.code }
  }

  // Erreurs déjà en français (Edge Functions, validations client) : on les garde telles quelles
  // et on génère un code générique.
  const isFrench = /[àâäéèêëîïôùûüç]/i.test(raw) || raw.startsWith('Le ') || raw.startsWith('L\'') || raw.startsWith('Un ')
  if (isFrench && raw.length < 120) return { message: raw, code: 'APP_ERROR' }

  return { message: "Une erreur inattendue s'est produite.", code: 'UNKNOWN_ERROR' }
}

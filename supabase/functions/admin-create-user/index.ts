// Edge Function : admin-create-user
// Crée un utilisateur Supabase Auth avec un mot de passe défini par l'admin.
// Nécessite la service_role key (jamais exposée côté client).
// Protection : vérifie que l'appelant est bien admin avant d'agir.
//
// Correctifs sécurité :
//   S1 : CORS restreint aux origines autorisées (plus de '*')
//        → Configurer ALLOWED_ORIGINS dans les secrets Edge Functions Supabase
//          Ex : https://mon-projet.vercel.app,http://localhost:5173
//   S2 : Validation email (regex) + bornes mot de passe côté serveur

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS : origines autorisées ───────────────────────────────────────────────
const ALLOWED_ORIGINS: string[] = (
  Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173'
).split(',').map(o => o.trim()).filter(Boolean)

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

// ── Validation ───────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254
}

// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  // Gestion CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Authentification de l'appelant ────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client avec le JWT de l'appelant (respecte les RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Vérifie l'identité de l'appelant
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 2. Vérification du rôle admin ────────────────────────────────────────
    const { data: membership } = await supabaseClient
      .from('festival_members')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 3. Lecture et validation du payload ──────────────────────────────────
    const body = await req.json().catch(() => ({}))
    const { email, password, fullName } = body

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'email est obligatoire' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    if (!isValidEmail(cleanEmail)) {
      return new Response(
        JSON.stringify({ error: 'Format d\'email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'password est obligatoire' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6 || password.length > 72) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit faire entre 6 et 72 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanFullName = (typeof fullName === 'string' && fullName.trim())
      ? fullName.trim().slice(0, 100)
      : cleanEmail.split('@')[0]

    // ── 4. Création de l'utilisateur avec la service_role key ────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      user_metadata: { full_name: cleanFullName },
      email_confirm: true, // Pas besoin de confirmer l'email pour les comptes créés par un admin
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ user: { id: data.user.id, email: data.user.email } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[admin-create-user] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

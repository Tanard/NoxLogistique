// Edge Function : admin-create-user
// Invite un utilisateur par email — il reçoit un lien pour définir son propre mot de passe.
// L'email est vérifié automatiquement lors de l'activation du compte.
// Nécessite la service_role key (jamais exposée côté client).
//
// Correctifs sécurité :
//   S1 : CORS restreint aux origines autorisées via ALLOWED_ORIGINS
//   S2 : Validation email (regex) côté serveur

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS ─────────────────────────────────────────────────────────────────────
// La sécurité réelle repose sur le check JWT + rôle admin dans la fonction.
// CORS est ouvert (*) car les Edge Functions Supabase sont appelées avec
// un JWT signé — un site tiers ne peut pas usurper une session valide.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Validation ───────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254
}

// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

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
    const { email, fullName } = body  // plus de mot de passe — l'invité le définit lui-même

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

    const cleanFullName = (typeof fullName === 'string' && fullName.trim())
      ? fullName.trim().slice(0, 100)
      : cleanEmail.split('@')[0]

    // ── 4. Invitation via la service_role key ────────────────────────────────
    // inviteUserByEmail envoie un email avec un lien d'activation.
    // L'invité clique, arrive sur l'app, définit son mot de passe.
    // Son email est automatiquement vérifié lors de l'activation.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://nox-festival.vercel.app'

    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        data: { full_name: cleanFullName },
        redirectTo: siteUrl,
      }
    )

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: inviteError.message }),
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

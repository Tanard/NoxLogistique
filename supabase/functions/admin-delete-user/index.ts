// Edge Function : admin-delete-user
// Supprime définitivement un utilisateur Supabase Auth.
// La suppression cascade : profiles + festival_members sont supprimés automatiquement
// grâce aux contraintes ON DELETE CASCADE définies dans le schéma SQL.
// Protection : vérifie que l'appelant est admin et ne peut pas se supprimer lui-même.
//
// Correctifs sécurité :
//   S1 : CORS restreint aux origines autorisées (plus de '*')
//        → Configurer ALLOWED_ORIGINS dans les secrets Edge Functions Supabase
//   S2 : Validation UUID du userId avant toute opération

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
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
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
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userId est obligatoire' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'userId invalide (format UUID attendu)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Protection : un admin ne peut pas se supprimer lui-même
    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ error: 'Impossible de supprimer votre propre compte' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 4. Suppression via la service_role key ───────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[admin-delete-user] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

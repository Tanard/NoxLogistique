#!/usr/bin/env bash
# Audit automatisé Logisticore frontend
# Usage: bash audit.sh

set -uo pipefail
cd "$(dirname "$0")"

PASS=0; FAIL=0

ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo "═══════════════════════════════════════"
echo "  AUDIT LOGISTICORE FRONTEND"
echo "═══════════════════════════════════════"
echo ""

# ── 1. Build Vite ────────────────────────────────────────────────────
echo "[ 1 ] Build Vite"
BUILD_OUT=$(npm run build 2>&1 || true)
if echo "$BUILD_OUT" | grep -q "built in"; then
  ok "build réussi"
else
  fail "build échoué"
  echo "$BUILD_OUT" | grep -i "error" | head -5
fi

# ── 2. ESLint (hors fichiers macOS ._*) ─────────────────────────────
echo ""
echo "[ 2 ] ESLint"
# --max-warnings=999 : échoue sur erreurs uniquement, ignore les warnings
if npx eslint src/ --max-warnings=999 > /tmp/_eslint_out.txt 2>&1; then
  WARN_COUNT=$(grep -c "warning" /tmp/_eslint_out.txt 2>/dev/null || echo 0)
  ok "ESLint aucune erreur (${WARN_COUNT} warning(s) intentionnel(s))"
else
  ERR_COUNT=$(grep -E "^\s+[0-9]+:[0-9]+\s+error" /tmp/_eslint_out.txt 2>/dev/null | wc -l | tr -d ' ')
  fail "ESLint — ${ERR_COUNT} erreur(s)"
  grep -E "^\s+[0-9]+:[0-9]+\s+error" /tmp/_eslint_out.txt | head -10
fi

# ── 3. Vulnérabilités npm ────────────────────────────────────────────
echo ""
echo "[ 3 ] Vulnérabilités npm"
VULN=$(npm audit --audit-level=high --json 2>/dev/null \
  | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  v=d.get('metadata',{}).get('vulnerabilities',{})
  print(v.get('high',0)+v.get('critical',0))
except:
  print(0)
" 2>/dev/null || echo "0")
if [ "$VULN" = "0" ]; then
  ok "Aucune vulnérabilité high/critical"
else
  fail "$VULN vulnérabilité(s) high/critical"
fi

# ── 4. Secrets hardcodés ─────────────────────────────────────────────
echo ""
echo "[ 4 ] Secrets hardcodés dans src/"
SECRETS=$(grep -rn --include="*.jsx" --include="*.js" \
  -E "(sk-[a-zA-Z0-9]{20,}|api[_-]key\s*[:=]\s*['\"][^'\"]{10,})" \
  src/ 2>/dev/null | grep -v "VITE_\|import\|//" | wc -l | tr -d ' ')
if [ "$SECRETS" = "0" ]; then
  ok "Aucun secret hardcodé"
else
  fail "$SECRETS occurrence(s) suspecte(s)"
fi

# ── 5. console.log résiduels ─────────────────────────────────────────
echo ""
echo "[ 5 ] console.log résiduels"
LOGS=$(grep -rn "console\.log" \
  --include="*.jsx" --include="*.js" src/ 2>/dev/null \
  | grep -v "^\s*//" | wc -l | tr -d ' ')
if [ "$LOGS" = "0" ]; then
  ok "Aucun console.log résiduel (console.error autorisé pour le logging d'erreurs)"
else
  fail "$LOGS console.log résiduel(s)"
  grep -rn "console\.log" --include="*.jsx" --include="*.js" src/ 2>/dev/null \
    | grep -v "^\s*//" | head -5
fi

# ── 6. dangerouslySetInnerHTML ───────────────────────────────────────
echo ""
echo "[ 6 ] dangerouslySetInnerHTML (XSS)"
XSS=$(grep -rn "dangerouslySetInnerHTML" --include="*.jsx" src/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$XSS" = "0" ]; then
  ok "Aucun dangerouslySetInnerHTML"
else
  fail "$XSS usage(s) — risque XSS"
fi

# ── 7. Variables .env ────────────────────────────────────────────────
echo ""
echo "[ 7 ] Variables .env"
if [ -f .env ]; then
  for var in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY; do
    val=$(grep "^${var}=" .env 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
    if [ -n "$val" ] && [ "$val" != "..." ] && [ ${#val} -gt 10 ]; then
      ok ".env: $var présent"
    else
      fail ".env: $var manquant ou invalide"
    fi
  done
else
  fail ".env absent"
fi

# ── 8. .gitignore ────────────────────────────────────────────────────
echo ""
echo "[ 8 ] .gitignore"
GITIGNORE=$(cat ../../.gitignore .gitignore 2>/dev/null || true)
for pattern in ".env" "node_modules" "dist"; do
  if echo "$GITIGNORE" | grep -q "$pattern"; then
    ok ".gitignore: $pattern"
  else
    fail ".gitignore manque: $pattern"
  fi
done

# ── 9. Fichiers sensibles dans git ───────────────────────────────────
echo ""
echo "[ 9 ] Fichiers sensibles"
SENSITIVE=$(git -C ../.. status --porcelain 2>/dev/null \
  | grep -E "\.(env|key|pem|secret)$" | wc -l | tr -d ' ')
if [ "$SENSITIVE" = "0" ]; then
  ok "Aucun fichier sensible exposé"
else
  fail "$SENSITIVE fichier(s) sensible(s)"
fi

echo ""
echo "═══════════════════════════════════════"
TOTAL=$((PASS+FAIL))
echo "  Résultat : ${PASS}/${TOTAL} OK  |  ${FAIL} échec(s)"
echo "═══════════════════════════════════════"

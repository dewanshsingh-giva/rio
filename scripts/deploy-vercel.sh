#!/usr/bin/env bash
# Deploy RIO to Vercel, pointing at Big Ears via a tunnel (cloudflared / ngrok).
#
# Usage:
#   export BIG_EARS_NGROK_URL=https://xxxx.trycloudflare.com   # no trailing slash
#   export BIG_EARS_API_KEY=dev-local-key                   # must match big-ears API_KEY
#   ./scripts/deploy-vercel.sh
#
# Prereqs: npm i -g vercel  (or use npx vercel), vercel login once
set -euo pipefail
cd "$(dirname "$0")/.."

NGROK_URL="${BIG_EARS_NGROK_URL:-}"
API_KEY="${BIG_EARS_API_KEY:-dev-local-key}"

if [[ -z "$NGROK_URL" ]]; then
  echo "Set BIG_EARS_NGROK_URL to your tunnel https URL (cloudflared: trycloudflare.com)"
  exit 1
fi

NGROK_URL="${NGROK_URL%/}"

echo "Testing Big Ears via tunnel…"
if ! curl -sf -H "ngrok-skip-browser-warning: 1" -H "x-api-key: $API_KEY" "$NGROK_URL/ready" >/dev/null; then
  echo "Cannot reach $NGROK_URL/ready — is the tunnel running and Big Ears up?"
  exit 1
fi

VERCEL="${VERCEL:-npx vercel}"

echo "Setting Vercel env vars…"
$VERCEL env rm BIG_EARS_API_URL production -y 2>/dev/null || true
$VERCEL env rm BIG_EARS_API_KEY production -y 2>/dev/null || true
printf '%s' "$NGROK_URL" | $VERCEL env add BIG_EARS_API_URL production
printf '%s' "$API_KEY" | $VERCEL env add BIG_EARS_API_KEY production

# Supabase — required for /ingest uploads (set in shell or .env.local before running)
if [[ -n "${SUPABASE_URL:-}" ]]; then
  $VERCEL env rm SUPABASE_URL production -y 2>/dev/null || true
  printf '%s' "$SUPABASE_URL" | $VERCEL env add SUPABASE_URL production
fi
if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  $VERCEL env rm SUPABASE_SERVICE_ROLE_KEY production -y 2>/dev/null || true
  printf '%s' "$SUPABASE_SERVICE_ROLE_KEY" | $VERCEL env add SUPABASE_SERVICE_ROLE_KEY production
fi
if [[ -n "${SUPABASE_STORAGE_BUCKET:-}" ]]; then
  $VERCEL env rm SUPABASE_STORAGE_BUCKET production -y 2>/dev/null || true
  printf '%s' "$SUPABASE_STORAGE_BUCKET" | $VERCEL env add SUPABASE_STORAGE_BUCKET production
fi
if [[ -n "${RECORDINGS_STORAGE:-}" ]]; then
  $VERCEL env rm RECORDINGS_STORAGE production -y 2>/dev/null || true
  printf '%s' "$RECORDINGS_STORAGE" | $VERCEL env add RECORDINGS_STORAGE production
fi

echo "Deploying to Vercel…"
$VERCEL --prod

echo ""
echo "Done. Keep Big Ears + tunnel running while the demo is live."
echo "If tunnel URL changes, re-run this script with the new BIG_EARS_NGROK_URL."

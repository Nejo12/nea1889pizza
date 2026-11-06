#!/usr/bin/env bash
# Runs the hosted (Preview) workerd suite inside a disposable Linux container with Supabase's published root CA trusted.
# The CA is needed only because workerd (like Cloudflare's runtime) rejects Supabase's private CA; see
# docs/issue-21-hosted-pooler-results.md. Usage: tests/workerd/preview-docker.sh   (needs .env.preflight, Docker)
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -f .env.preflight ] || { echo "missing .env.preflight (gitignored; see docs)"; exit 1; }
EXPECTED='80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA'
CTX=$(mktemp -d); trap 'rm -rf "$CTX"' EXIT
curl -sfL -o "$CTX/supabase-root.crt" https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
GOT=$(openssl x509 -in "$CTX/supabase-root.crt" -noout -fingerprint -sha256 | cut -d= -f2)
[ "$GOT" = "$EXPECTED" ] || { echo "unexpected CA fingerprint $GOT"; exit 1; }
cp -R lib app tests supabase package.json tsconfig.json "$CTX/"; rm -rf "$CTX/tests/workerd/.wrangler"
cat > "$CTX/suite.sh" <<'IN'
apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq ca-certificates curl >/dev/null 2>&1
cp /work/supabase-root.crt /usr/local/share/ca-certificates/supabase-root-2021.crt && update-ca-certificates >/dev/null 2>&1
cd /work && node --test --test-timeout=400000 tests/workerd/runtime.mjs
IN
docker run --rm --env-file .env.preflight -v "$CTX:/work" -v "$PWD/node_modules:/work/node_modules:ro" node:22-slim bash /work/suite.sh

#!/usr/bin/env bash
# Upsert demo-seed enablement keys in an Aegis Vault .env file.
# Generates BREAK_GLASS_GRANT_SECRET when missing, too short, or still the
# example placeholder. Never prints the secret. Does not create the file.
set -euo pipefail

ENV_FILE="${1:-}"
if [ -z "$ENV_FILE" ]; then
  echo "usage: ensure-demo-seed-env.sh <path-to-aegis-vault/.env>" >&2
  exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "missing $ENV_FILE" >&2
  exit 1
fi

upsert() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    awk -v k="$key" -v v="$value" '
      BEGIN { FS = OFS = "=" }
      $1 == k { $0 = k "=" v }
      { print }
    ' "$ENV_FILE" > "${ENV_FILE}.tmp"
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

upsert DEMO_SEED_RESET_ENABLED true
upsert DEMO_ENVIRONMENT demo
upsert DEMO_SEED_SCHEMA LUMINAFORGE

current="$(awk -F= '$1=="BREAK_GLASS_GRANT_SECRET" { print substr($0, index($0, "=") + 1); exit }' "$ENV_FILE" || true)"
if [ -z "$current" ] || [ "$current" = "replace-with-a-random-secret-at-deploy-time" ] || [ "${#current}" -lt 32 ]; then
  upsert BREAK_GLASS_GRANT_SECRET "$(openssl rand -base64 48 | tr -d '\n')"
fi

echo "Demo seed env keys ensured (secret not printed)"

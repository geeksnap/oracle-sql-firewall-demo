#!/usr/bin/env bash
# =============================================================================
# Print presenter URLs for the SQL Firewall demo on an OCI compute VM.
#
# Usage (on compute VM):
#   show_config.sh
#   sudo show_config.sh          # if not installed in PATH
#   sudo bash scripts/show_config.sh
# =============================================================================
set -euo pipefail

BOOTSTRAP_ENV="${BOOTSTRAP_ENV:-/root/sqlfw-bootstrap.env}"

load_bootstrap_env() {
  if [[ -r "$BOOTSTRAP_ENV" ]]; then
    # shellcheck disable=SC1090
    source "$BOOTSTRAP_ENV"
    return 0
  fi
  if [[ "$(id -u)" -ne 0 ]] && sudo test -r "$BOOTSTRAP_ENV" 2>/dev/null; then
    # shellcheck disable=SC1090
    source <(sudo grep -E '^export (WAF_LB_URL|DB_CONNECT_STRING|DB_PDB_NAME)=' "$BOOTSTRAP_ENV")
    return 0
  fi
  return 1
}

get_public_ip() {
  local meta ip
  for endpoint in opc/v1/vnics/ opc/v2/vnics/; do
    meta=$(curl -sf -H "Authorization: Bearer Oracle" "http://169.254.169.254/${endpoint}" 2>/dev/null) || continue
    if command -v jq >/dev/null 2>&1; then
      ip=$(echo "$meta" | jq -r '.[0].publicIp // empty')
    else
      ip=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0].get('publicIp',''))" <<<"$meta" 2>/dev/null || true)
    fi
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return 0
    fi
  done
  # Some shapes omit publicIp in vnic metadata; use egress IP as fallback.
  ip=$(curl -sf --max-time 3 https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]') || true
  if [[ -n "$ip" ]]; then
    echo "$ip"
    return 0
  fi
  return 1
}

trim_slash() {
  local url="$1"
  echo "${url%/}"
}

PUBLIC_IP=""
if ! PUBLIC_IP=$(get_public_ip); then
  PUBLIC_IP="${COMPUTE_PUBLIC_IP:-}"
fi

WAF_LB_URL="${WAF_LB_URL:-}"
if [[ -z "$WAF_LB_URL" ]] && load_bootstrap_env; then
  WAF_LB_URL="${WAF_LB_URL:-}"
fi
WAF_LB_URL="$(trim_slash "$WAF_LB_URL")"

echo "=== SQL Firewall Demo — Presenter URLs ==="
echo

if [[ -n "$PUBLIC_IP" ]]; then
  echo "Compute public IP    $PUBLIC_IP"
  echo
  printf "Aegis Vault          http://%s:3000\n" "$PUBLIC_IP"
  printf "LuminaForge (direct) http://%s:3001\n" "$PUBLIC_IP"
  printf "Compute :80 shortcut http://%s/\n" "$PUBLIC_IP"
else
  echo "Compute public IP    (unavailable — not on OCI metadata?)"
  echo "Aegis Vault          http://<compute_public_ip>:3000"
  echo "LuminaForge (direct) http://<compute_public_ip>:3001"
  echo "Compute :80 shortcut http://<compute_public_ip>/"
fi

echo
if [[ -n "$WAF_LB_URL" ]]; then
  echo "OCI WAF (LB)         ${WAF_LB_URL}/"
  echo "                     LuminaForge attack demos — canonical SQLi blocked here (403)"
else
  echo "OCI WAF (LB)         (not configured)"
  echo "                     Set WAF_LB_URL in ${BOOTSTRAP_ENV} or enable_waf on compute stack"
fi

if load_bootstrap_env 2>/dev/null; then
  echo
  echo "=== Database (from ${BOOTSTRAP_ENV}) ==="
  echo "PDB                  ${DB_PDB_NAME:-}"
  echo "Connect string       ${DB_CONNECT_STRING:-}"
fi

echo

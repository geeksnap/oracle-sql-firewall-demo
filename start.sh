#!/usr/bin/env bash
# ============================================================
#  start.sh — Start database check + Aegis Vault + LuminaForge
#
#  Aegis Vault  → http://localhost:3000  (SOC dashboard)
#  LuminaForge  → http://localhost:3001  (victim app)
#
#  Usage:
#    ./start.sh                    # local dev — both apps (npm run dev)
#    ./start.sh aegis|lumina|both  # subset of apps
#    ./start.sh --mode oci         # OCI compute VM — systemd services
#    ./start.sh --mode prod        # local production — npm start
#    ./start.sh --check-db         # database connectivity only
#    ./start.sh --skip-db-check    # start apps without DB probe
#
#  Start order: database (must already be running) → apps
#  See README.md (Start/stop) and terraform/README.md for OCI.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT/.pids"
LOG_DIR="$ROOT/logs"
SCRIPTS="$ROOT/scripts"

AEGIS_DIR="$ROOT/aegis-vault"
LUMINA_DIR="$ROOT/luminaforge"
AEGIS_PORT=3000
LUMINA_PORT=3001

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE="auto"
TARGET="both"
CHECK_DB_ONLY=false
SKIP_DB_CHECK=false

usage() {
  sed -n '4,16p' "$0" | sed 's/^# \{0,2\}//'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --mode)
      MODE="${2:?--mode requires local|oci|prod|auto}"
      shift 2
      ;;
    --check-db) CHECK_DB_ONLY=true; shift ;;
    --skip-db-check) SKIP_DB_CHECK=true; shift ;;
    aegis|lumina|both) TARGET="$1"; shift ;;
    *) echo "Unknown argument: $1" >&2; usage 1 ;;
  esac
done

detect_mode() {
  if [ "$MODE" != "auto" ]; then
    echo "$MODE"
    return
  fi
  if [ -f /etc/systemd/system/aegis-vault.service ] && command -v systemctl &>/dev/null; then
    echo "oci"
  else
    echo "local"
  fi
}

MODE="$(detect_mode)"

check_env_files() {
  local missing=0
  if [ ! -f "$AEGIS_DIR/.env" ]; then
    echo -e "  ${RED}✗${NC} Missing $AEGIS_DIR/.env (copy from .env.example)"
    missing=1
  fi
  if [ ! -f "$LUMINA_DIR/.env" ]; then
    echo -e "  ${RED}✗${NC} Missing $LUMINA_DIR/.env (copy from .env.example)"
    missing=1
  fi
  if [ "$missing" -ne 0 ]; then
    echo -e "${RED}Create .env files before starting apps.${NC}"
    exit 1
  fi
}

check_database() {
  echo -e "${CYAN}◎ Checking Oracle database connectivity…${NC}"
  if [ ! -d "$AEGIS_DIR/node_modules/oracledb" ]; then
    echo -e "  ${YELLOW}!${NC} Run: cd aegis-vault && npm ci"
    exit 1
  fi
  if node "$SCRIPTS/check-db-connection.mjs"; then
    echo -e "  ${GREEN}✓${NC} Database is reachable"
    return 0
  fi
  echo -e "  ${RED}✗${NC} Database not reachable — start Oracle PDB first (see README.md Start/stop)"
  return 1
}

# ── Local: stop a running app by PID file + port sweep ─────
stop_app_local() {
  local name="$1"
  local port="$2"
  local pid_file="$PID_DIR/$name.pid"

  if [ -f "$pid_file" ]; then
    local pid
    pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      local pgid
      pgid=$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ') || true
      if [ -n "$pgid" ] && [ "$pgid" != "0" ]; then
        kill -- -"$pgid" 2>/dev/null || true
      else
        kill "$pid" 2>/dev/null || true
      fi
      echo -e "  ${YELLOW}↓${NC} Stopped $name (PID $pid)"
    fi
    rm -f "$pid_file"
  fi

  local stragglers
  stragglers=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$stragglers" ]; then
    echo "$stragglers" | xargs kill -9 2>/dev/null || true
    sleep 0.3
  fi
}

start_app_local() {
  local name="$1"
  local dir="$2"
  local port="$3"
  local npm_cmd="$4"
  local log="$LOG_DIR/$name.log"
  local pid_file="$PID_DIR/$name.pid"

  echo -e "  ${CYAN}→${NC} Starting $name on :$port ($npm_cmd)"
  echo -e "     Log: logs/$name.log"

  (
    cd "$dir"
    if [ -f "$log" ]; then
      tail -n 500 "$log" > "$log.prev" 2>/dev/null && mv "$log.prev" "$log" || true
    fi
    $npm_cmd >> "$log" 2>&1
  ) &

  local pid=$!
  echo "$pid" > "$pid_file"
  echo -e "  ${GREEN}✓${NC} $name started (PID $pid)"
}

start_app_oci() {
  local unit="$1"
  echo -e "  ${CYAN}→${NC} Starting $unit"
  if systemctl is-active --quiet "$unit"; then
    echo -e "  ${GREEN}✓${NC} $unit already active"
  else
    sudo systemctl start "$unit"
    echo -e "  ${GREEN}✓${NC} $unit started"
  fi
}

start_local() {
  local npm_cmd="npm run dev"
  [ "$MODE" = "prod" ] && npm_cmd="npm start"

  mkdir -p "$PID_DIR" "$LOG_DIR"
  check_env_files

  if [ "$SKIP_DB_CHECK" = false ]; then
    check_database || exit 1
  fi

  case "$TARGET" in
    aegis)
      echo -e "\n${CYAN}◎ Restarting Aegis Vault…${NC}"
      stop_app_local "aegis-vault" "$AEGIS_PORT"
      sleep 0.5
      start_app_local "aegis-vault" "$AEGIS_DIR" "$AEGIS_PORT" "$npm_cmd"
      ;;
    lumina)
      echo -e "\n${CYAN}✦ Restarting LuminaForge…${NC}"
      stop_app_local "luminaforge" "$LUMINA_PORT"
      sleep 0.5
      start_app_local "luminaforge" "$LUMINA_DIR" "$LUMINA_PORT" "$npm_cmd"
      ;;
    both|*)
      echo -e "\n${CYAN}◎ Oracle SQL Firewall Demo — Starting both apps${NC}"
      echo -e "${YELLOW}────────────────────────────────────────────${NC}"
      stop_app_local "aegis-vault" "$AEGIS_PORT"
      stop_app_local "luminaforge" "$LUMINA_PORT"
      sleep 0.5
      start_app_local "aegis-vault" "$AEGIS_DIR" "$AEGIS_PORT" "$npm_cmd"
      start_app_local "luminaforge" "$LUMINA_DIR" "$LUMINA_PORT" "$npm_cmd"
      ;;
  esac

  echo ""
  echo -e "${YELLOW}Waiting for apps to boot (up to 20s)…${NC}"
  sleep 4

  local aegis_ready=false lumina_ready=false
  for _ in $(seq 1 16); do
    if [ "$TARGET" = "lumina" ] || \
       grep -q "localhost:$AEGIS_PORT\|SOC dashboard\|Ready in" "$LOG_DIR/aegis-vault.log" 2>/dev/null; then
      aegis_ready=true
    fi
    if [ "$TARGET" = "aegis" ] || \
       grep -q "localhost:$LUMINA_PORT\|Dark Luxury\|Ready in" "$LOG_DIR/luminaforge.log" 2>/dev/null; then
      lumina_ready=true
    fi
    [ "$aegis_ready" = true ] && [ "$lumina_ready" = true ] && break
    sleep 1
  done

  echo ""
  echo -e "${YELLOW}────────────────────────────────────────────${NC}"
  if [ "$TARGET" != "lumina" ]; then
    grep -q "SOC dashboard\|localhost:$AEGIS_PORT\|Ready in" "$LOG_DIR/aegis-vault.log" 2>/dev/null \
      && echo -e "  ${GREEN}✓${NC} Aegis Vault  → http://localhost:$AEGIS_PORT" \
      || echo -e "  ${RED}?${NC} Aegis Vault  → check logs/aegis-vault.log"
  fi
  if [ "$TARGET" != "aegis" ]; then
    grep -q "Dark Luxury\|localhost:$LUMINA_PORT\|Ready in" "$LOG_DIR/luminaforge.log" 2>/dev/null \
      && echo -e "  ${GREEN}✓${NC} LuminaForge  → http://localhost:$LUMINA_PORT" \
      || echo -e "  ${RED}?${NC} LuminaForge  → check logs/luminaforge.log"
  fi
  echo -e "${YELLOW}────────────────────────────────────────────${NC}"
  echo -e "  Stop all:  ${CYAN}./stop.sh${NC}"
  echo -e "  Follow logs: ${CYAN}tail -f logs/aegis-vault.log logs/luminaforge.log${NC}"
  echo ""
}

start_oci() {
  echo -e "\n${CYAN}◎ OCI compute — starting systemd services${NC}"
  echo -e "${YELLOW}────────────────────────────────────────────${NC}"
  echo -e "  ${YELLOW}Note:${NC} Base DB must be AVAILABLE in OCI before apps can connect."

  case "$TARGET" in
    aegis)  start_app_oci aegis-vault.service ;;
    lumina) start_app_oci luminaforge.service ;;
    both|*)
      start_app_oci luminaforge.service
      start_app_oci aegis-vault.service
      ;;
  esac

  echo ""
  sudo systemctl is-active aegis-vault luminaforge || true
  echo -e "${YELLOW}────────────────────────────────────────────${NC}"
  echo -e "  Stop all:  ${CYAN}./stop.sh --mode oci${NC}"
  echo -e "  Status:    ${CYAN}sudo systemctl status aegis-vault luminaforge${NC}"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────
if [ "$CHECK_DB_ONLY" = true ]; then
  check_env_files
  check_database
  exit 0
fi

case "$MODE" in
  oci) start_oci ;;
  prod|local) start_local ;;
  *)
    echo "Unknown mode: $MODE (use local, oci, prod, or auto)" >&2
    exit 1
    ;;
esac

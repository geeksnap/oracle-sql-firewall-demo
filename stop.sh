#!/usr/bin/env bash
# ============================================================
#  stop.sh — Stop Aegis Vault + LuminaForge
#
#  Usage:
#    ./stop.sh                    # local — stop both dev servers
#    ./stop.sh aegis|lumina|both  # subset
#    ./stop.sh --mode oci         # OCI compute VM — systemd services
#
#  Stop order: apps first (releases DB sessions), then database
#  OCI Base DB stop/start: README.md (Start/stop) and terraform/README.md
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$ROOT/.pids"

AEGIS_PORT=3000
LUMINA_PORT=3001

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

MODE="auto"
TARGET="both"

usage() {
  sed -n '4,11p' "$0" | sed 's/^# \{0,2\}//'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --mode)
      MODE="${2:?--mode requires local|oci|auto}"
      shift 2
      ;;
    aegis|lumina|both) TARGET="$1"; shift ;;
    *) echo "Unknown argument: $1" >&2; usage 1 ;;
  esac
done

if [ "$MODE" = "auto" ]; then
  if [ -f /etc/systemd/system/aegis-vault.service ] && command -v systemctl &>/dev/null; then
    MODE="oci"
  else
    MODE="local"
  fi
fi

stop_app_local() {
  local name="$1"
  local port="$2"
  local pid_file="$PID_DIR/$name.pid"
  local stopped=false

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
      stopped=true
    fi
    rm -f "$pid_file"
  fi

  local stragglers
  stragglers=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$stragglers" ]; then
    echo "$stragglers" | xargs kill -9 2>/dev/null || true
    stopped=true
  fi

  if [ "$stopped" = true ]; then
    echo -e "  ${GREEN}✓${NC} $name stopped (port $port cleared)"
  else
    echo -e "  ${YELLOW}–${NC} $name was not running"
  fi
}

stop_app_oci() {
  local unit="$1"
  if systemctl is-active --quiet "$unit" 2>/dev/null; then
    sudo systemctl stop "$unit"
    echo -e "  ${GREEN}✓${NC} $unit stopped"
  else
    echo -e "  ${YELLOW}–${NC} $unit was not running"
  fi
}

echo ""
case "$MODE" in
  oci)
    echo -e "${YELLOW}Stopping OCI systemd services…${NC}"
    case "$TARGET" in
      aegis)  stop_app_oci aegis-vault.service ;;
      lumina) stop_app_oci luminaforge.service ;;
      both|*)
        stop_app_oci aegis-vault.service
        stop_app_oci luminaforge.service
        ;;
    esac
    echo -e "  ${CYAN}Tip:${NC} Stop Base DB in OCI Console when demo is done (see README.md Start/stop)"
    ;;
  local)
    case "$TARGET" in
      aegis)
        echo -e "${YELLOW}Stopping Aegis Vault…${NC}"
        stop_app_local "aegis-vault" "$AEGIS_PORT"
        ;;
      lumina)
        echo -e "${YELLOW}Stopping LuminaForge…${NC}"
        stop_app_local "luminaforge" "$LUMINA_PORT"
        ;;
      both|*)
        echo -e "${YELLOW}Stopping all demo apps…${NC}"
        stop_app_local "aegis-vault" "$AEGIS_PORT"
        stop_app_local "luminaforge" "$LUMINA_PORT"
        ;;
    esac
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    exit 1
    ;;
esac
echo ""

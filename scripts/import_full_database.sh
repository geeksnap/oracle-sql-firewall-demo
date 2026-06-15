#!/usr/bin/env bash
# ========================================================================
# Restore a full Data Pump export (FULL=Y) into PDB or CDB
# ========================================================================
# WARNING: FULL import can overwrite objects. Use on empty PDB or test clone.
# ========================================================================

set -euo pipefail

: "${DPUMP_USER:=SYS}"
: "${DPUMP_PASSWORD:=${DB_PASSWORD:-}}"
: "${DPUMP_CONNECT:=${DB_CONNECTION_STRING:-}}"
: "${DPUMP_DIRECTORY:=DEMO_DPUMP_DIR}"
: "${DPUMP_DUMPFILE:=oracle_sqlfw_demo_%U.dmp}"
: "${DPUMP_LOGFILE:=oracle_sqlfw_demo_import.log}"
: "${DPUMP_PARALLEL:=2}"

if [[ -z "${DPUMP_PASSWORD}" ]]; then
  echo "ERROR: Set DPUMP_PASSWORD or DB_PASSWORD" >&2
  exit 1
fi
if [[ -z "${DPUMP_CONNECT}" ]]; then
  echo "ERROR: Set DPUMP_CONNECT or DB_CONNECTION_STRING" >&2
  exit 1
fi

CONNECT_STR="${DPUMP_USER}/${DPUMP_PASSWORD}@${DPUMP_CONNECT} AS SYSDBA"

echo "=== Oracle Data Pump FULL import ==="
echo "Connect:    ${DPUMP_USER}@${DPUMP_CONNECT}"
echo "Directory:  ${DPUMP_DIRECTORY}"
echo "Dumpfiles:  ${DPUMP_DUMPFILE}"
echo ""

impdp "'${CONNECT_STR}'" \
  DIRECTORY="${DPUMP_DIRECTORY}" \
  DUMPFILE="${DPUMP_DUMPFILE}" \
  LOGFILE="${DPUMP_LOGFILE}" \
  PARALLEL="${DPUMP_PARALLEL}" \
  FULL=Y \
  TABLE_EXISTS_ACTION=REPLACE

echo "=== Import finished — review ${DPUMP_LOGFILE} on DB server ==="

#!/usr/bin/env bash
# ========================================================================
# Full Oracle Data Pump export — oracle-sql-firewall-demo
# ========================================================================
# Run on the database server (or any host with expdp + network to DB + write
# access to the DIRECTORY path on the DB server filesystem).
#
# Typical: SSH to DB host, clone repo, run scripts/data_pump_setup.sql as SYS,
# then run this script with DB_CONNECTION_STRING and DB_PASSWORD set.
# ========================================================================

set -euo pipefail

# --- Connection (override via environment) ---
: "${DPUMP_USER:=SYS}"
: "${DPUMP_PASSWORD:=${DB_PASSWORD:-}}"
: "${DPUMP_CONNECT:=${DB_CONNECTION_STRING:-}}"
: "${DPUMP_DIRECTORY:=DEMO_DPUMP_DIR}"
: "${DPUMP_PARALLEL:=2}"
: "${DPUMP_MODE:=pdb}"   # pdb | cdb

# Dump file prefix (timestamped)
STAMP="$(date +%Y%m%d_%H%M%S)"
: "${DPUMP_DUMP_PREFIX:=oracle_sqlfw_demo_${STAMP}}"
: "${DPUMP_LOGFILE:=${DPUMP_DUMP_PREFIX}_export.log}"

if [[ -z "${DPUMP_PASSWORD}" ]]; then
  echo "ERROR: Set DPUMP_PASSWORD or DB_PASSWORD" >&2
  exit 1
fi
if [[ -z "${DPUMP_CONNECT}" ]]; then
  echo "ERROR: Set DPUMP_CONNECT or DB_CONNECTION_STRING" >&2
  exit 1
fi

# expdp connect string: SYS requires AS SYSDBA
CONNECT_STR="${DPUMP_USER}/${DPUMP_PASSWORD}@${DPUMP_CONNECT} AS SYSDBA"

echo "=== Oracle Data Pump FULL export ==="
echo "Mode:       ${DPUMP_MODE}"
echo "Connect:    ${DPUMP_USER}@${DPUMP_CONNECT}"
echo "Directory:  ${DPUMP_DIRECTORY}"
echo "Dumpfiles:  ${DPUMP_DUMP_PREFIX}_%U.dmp"
echo "Log:        ${DPUMP_LOGFILE}"
echo ""

EXTRA_ARGS=()
case "${DPUMP_MODE}" in
  pdb)
    # Connect to PDB service → FULL=Y exports all schemas in AHDB2605_PDB1
    EXTRA_ARGS+=(FULL=Y)
    ;;
  cdb)
    # Connect to CDB$ROOT service (not PDB service) → entire multitenant database
    echo "NOTE: DPUMP_CONNECT must be the CDB service, not the PDB service."
    EXTRA_ARGS+=(FULL=Y)
    ;;
  *)
    echo "ERROR: DPUMP_MODE must be pdb or cdb" >&2
    exit 1
    ;;
esac

expdp "'${CONNECT_STR}'" \
  DIRECTORY="${DPUMP_DIRECTORY}" \
  DUMPFILE="${DPUMP_DUMP_PREFIX}_%U.dmp" \
  LOGFILE="${DPUMP_LOGFILE}" \
  PARALLEL="${DPUMP_PARALLEL}" \
  COMPRESSION=ALL \
  "${EXTRA_ARGS[@]}"

echo ""
echo "=== Export finished ==="
echo "Copy dump files from the DIRECTORY path on the DB server."
echo "List files (run in SQL*Plus as SYS):"
echo "  SELECT filename, bytes/1024/1024 AS mb FROM dba_datapump_jobs; -- if job still listed"
echo "Or: ls -la /u01/app/oracle/dpdump/demo-export/   # if using DEMO_DPUMP_DIR default path"

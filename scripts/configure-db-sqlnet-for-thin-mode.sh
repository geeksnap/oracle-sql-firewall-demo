#!/usr/bin/env bash
# Configure OCI Base DB sqlnet.ora so node-oracledb Thin Mode can connect on TCP :1521.
# Run on the DB VM as opc (with sudo). Thin mode does not support Native Network Encryption (NNE).
set -euo pipefail

ORACLE_HOME="$(sudo -u oracle bash -lc 'echo "$ORACLE_HOME"')"
if [[ -z "$ORACLE_HOME" || ! -d "$ORACLE_HOME/network/admin" ]]; then
  ORACLE_HOME="$(find /u01/app/oracle/product -maxdepth 3 -type d -name dbhome_1 2>/dev/null | sort -V | tail -1)"
fi

if [[ -z "$ORACLE_HOME" || ! -d "$ORACLE_HOME/network/admin" ]]; then
  echo "ERROR: Could not locate ORACLE_HOME/network/admin" >&2
  exit 1
fi

SQLNET="${ORACLE_HOME}/network/admin/sqlnet.ora"
echo "Updating ${SQLNET} ..."

sudo -u oracle bash -lc "
  touch '${SQLNET}'
  tmp=\$(mktemp)
  grep -v '^SQLNET.ENCRYPTION_SERVER=' '${SQLNET}' | grep -v '^SQLNET.CRYPTO_CHECKSUM_SERVER=' > \"\${tmp}\" || true
  mv \"\${tmp}\" '${SQLNET}'
  cat >> '${SQLNET}' <<'EOF'
SQLNET.ENCRYPTION_SERVER=ACCEPTED
SQLNET.CRYPTO_CHECKSUM_SERVER=ACCEPTED
EOF
"

sudo -u oracle bash -lc "lsnrctl reload"
echo "[SUCCESS] sqlnet.ora updated — thin-mode clients can connect on TCP :1521"

#!/usr/bin/env bash
# Poll SQL Firewall violations every 2 seconds on the DB server.
# Usage: ./watch_firewall_loop.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

while true; do
  clear
  date
  sqlplus -s /nolog @"${SCRIPT_DIR}/watch_firewall_violations.sql" 2>&1
  sleep 2
done

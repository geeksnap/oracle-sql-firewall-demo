-- ========================================================================
-- Real-time SQL Firewall violation watch (run on DB server)
-- Session 1: connect as AEGIS_APP, then @this script
-- Session 2: run attacks as luminaforge
--
--   sqlplus aegis_app/<password>@<host>:1521/<service> @scripts/watch_firewall_violations.sql
-- ========================================================================

WHENEVER SQLERROR EXIT SQL.SQLCODE

SET ECHO OFF FEEDBACK OFF VERIFY OFF HEADING ON LINESIZE 220 PAGESIZE 100
COLUMN now_at FORMAT A26
COLUMN lag_seconds FORMAT 999990.999
COLUMN username FORMAT A14
COLUMN firewall_action FORMAT A10
COLUMN cause FORMAT A18
COLUMN sql_snip FORMAT A60

PROMPT
PROMPT === Aegis watch: violations for luminaforge (refresh every 2s, Ctrl+C to stop) ===
PROMPT === Optional: run Oracle_DB_Aegis_Flush_Grant.sql as SYS for flush in this script ===
PROMPT

BEGIN
  SYS.aegis_fw_flush_logs;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- flush grant not installed; view may lag ~1 minute
END;
/

SELECT TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.FF3') AS now_at,
       COUNT(*) AS violation_rows,
       TO_CHAR(MAX(occurred_at), 'YYYY-MM-DD HH24:MI:SS.FF3') AS latest_occurred_at,
       ROUND(
         (CAST(SYSTIMESTAMP AS TIMESTAMP) - CAST(MAX(occurred_at) AS TIMESTAMP))
         * 86400,
         3
       ) AS lag_seconds
FROM   dba_sql_firewall_violations
WHERE  UPPER(username) = 'LUMINAFORGE';

PROMPT
PROMPT --- Latest 5 violations ---
PROMPT

SELECT TO_CHAR(v.occurred_at, 'HH24:MI:SS.FF3') AS occurred_at,
       v.username,
       v.firewall_action,
       v.cause,
       SUBSTR(v.sql_text, 1, 60) AS sql_snip
FROM   dba_sql_firewall_violations v
WHERE  UPPER(v.username) IN ('AEGIS_APP', 'LUMINAFORGE')
ORDER  BY v.occurred_at DESC
FETCH FIRST 5 ROWS ONLY;

EXIT

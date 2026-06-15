-- ========================================================================
-- Oracle Data Pump — directory setup for full database / PDB export
-- Run once as SYS AS SYSDBA (CDB$ROOT or PDB session is fine for grants)
-- ========================================================================
-- Before running: create the OS folder on the DATABASE SERVER (not your laptop)
--   e.g. mkdir -p /u01/app/oracle/dpdump/demo-export
--   chown oracle:oinstall /u01/app/oracle/dpdump/demo-export
-- ========================================================================

WHENEVER SQLERROR EXIT SQL.SQLCODE

SET ECHO ON FEEDBACK ON SERVEROUTPUT ON SIZE UNLIMITED

PROMPT === Existing Data Pump directories ===
SELECT directory_name, directory_path
FROM   dba_directories
WHERE  UPPER(directory_name) LIKE '%DUMP%'
   OR  UPPER(directory_name) LIKE '%PUMP%'
ORDER  BY 1;

PROMPT === Create DEMO_DPUMP_DIR (skip if you will use DATA_PUMP_DIR only) ===

BEGIN
  EXECUTE IMMEDIATE q'[
    CREATE OR REPLACE DIRECTORY DEMO_DPUMP_DIR AS '/u01/app/oracle/dpdump/demo-export'
  ]';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -32001 THEN
      NULL; -- already exists
    ELSE
      RAISE;
    END IF;
END;
/

GRANT READ, WRITE ON DIRECTORY DEMO_DPUMP_DIR TO SYS;
GRANT READ, WRITE ON DIRECTORY DEMO_DPUMP_DIR TO SYSTEM;

PROMPT === Optional: grant to demo users (read-only import/export of own schemas) ===
-- GRANT READ, WRITE ON DIRECTORY DEMO_DPUMP_DIR TO luminaforge;
-- GRANT READ, WRITE ON DIRECTORY DEMO_DPUMP_DIR TO AEGIS_APP;

PROMPT === Verify ===
SELECT directory_name, directory_path
FROM   dba_directories
WHERE  directory_name IN ('DEMO_DPUMP_DIR', 'DATA_PUMP_DIR')
ORDER  BY 1;

PROMPT === Done. Use DIRECTORY=DEMO_DPUMP_DIR or DATA_PUMP_DIR in expdp/impdp ===

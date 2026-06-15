-- ========================================================================
-- Run as SYS AS SYSDBA when Aegis Vault Demo Control returns ORA-47605
-- (SQL Firewall blocked the AEGIS_APP session — allow-list was re-enabled)
-- SQL Developer: connection "Demo DB 26ai SYS (SYSDBA)" → Run Script
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

BEGIN
  SYS.DBMS_SQL_FIREWALL.DISABLE_ALLOW_LIST(username => 'AEGIS_APP');
END;
/

PROMPT === AEGIS_APP allow-list (expect STATUS=DISABLED) ===
SELECT username, status, block, enforce
FROM   sys.dba_sql_firewall_allow_lists
WHERE  UPPER(username) = 'AEGIS_APP';

PROMPT === [SUCCESS] SOC user AEGIS_APP can call SYS.aegis_demo_control again ===

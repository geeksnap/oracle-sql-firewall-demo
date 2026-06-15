-- ========================================================================
-- Run once in SQL Developer: connection "Demo DB 26ai SYS (SYSDBA)"
-- Run Script (not Run Statement) — F5 or toolbar "Run Script"
-- ========================================================================
@Oracle_DB_Aegis_Flush_Grant.sql
@Oracle_DB_Demo_Control_Grant.sql
-- If Demo Control returns ORA-47605: @Oracle_DB_Repair_AEGIS_SOC.sql

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

SELECT object_name, object_type, status
FROM   dba_objects
WHERE  owner = 'SYS'
AND    object_name IN ('AEGIS_DEMO_CONTROL', 'AEGIS_FW_FLUSH_LOGS')
ORDER BY object_name, object_type;

SELECT grantee, privilege
FROM   dba_tab_privs
WHERE  grantee = 'AEGIS_APP'
AND    owner = 'SYS'
AND    table_name IN ('AEGIS_DEMO_CONTROL', 'AEGIS_FW_FLUSH_LOGS');

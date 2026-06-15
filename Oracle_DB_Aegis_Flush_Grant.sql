-- ========================================================================
-- Run once as SYS AS SYSDBA in PDB AHDB2605_PDB1
-- Lets AEGIS_APP flush in-memory SQL Firewall logs before each SOC poll
-- (Without this, DBA_SQL_FIREWALL_VIOLATIONS can lag ~1 minute.)
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

CREATE OR REPLACE PROCEDURE SYS.aegis_fw_flush_logs
AUTHID DEFINER
AS
BEGIN
  SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS;
END;
/

GRANT EXECUTE ON SYS.aegis_fw_flush_logs TO AEGIS_APP;

PROMPT === [SUCCESS] AEGIS_APP can call SYS.aegis_fw_flush_logs for real-time violations ===

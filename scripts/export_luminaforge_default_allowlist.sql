-- ========================================================================
-- Optional: export luminaforge allow-list JSON after manual capture training.
-- Primary demo path uses Demo Control "Initialize default demo policy" (bootstrap).
-- Run as SYS AS SYSDBA in PDB AHDB2605_PDB1; save CLOB output to sql/luminaforge_default_allowlist.json
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

SET SERVEROUTPUT ON SIZE UNLIMITED

DECLARE
  l_clob CLOB;
BEGIN
  DBMS_LOB.CREATETEMPORARY(l_clob, TRUE);
  SYS.DBMS_SQL_FIREWALL.EXPORT_ALLOW_LIST(
    username   => 'LUMINAFORGE',
    allow_list => l_clob
  );
  DBMS_OUTPUT.PUT_LINE(DBMS_LOB.SUBSTR(l_clob, 32000, 1));
  DBMS_LOB.FREETEMPORARY(l_clob);
END;
/

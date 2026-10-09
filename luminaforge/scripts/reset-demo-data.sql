-- LuminaForge full demo reset. Generated seed values live in:
--   seed/luminaforge-demo-seed.json
-- Run as SYS or LUMINAFORGE in AHDB2605_PDB1.
ALTER SESSION SET CONTAINER = AHDB2605_PDB1;
@@../../sql/luminaforge_demo_seed.sql

DECLARE
  l_users NUMBER;
  l_portfolio NUMBER;
  l_transactions NUMBER;
  l_luxury_items NUMBER;
BEGIN
  luminaforge.aegis_demo_seed.initialize(
    SYSTIMESTAMP AT TIME ZONE 'UTC',
    l_users, l_portfolio, l_transactions, l_luxury_items
  );
  DBMS_OUTPUT.PUT_LINE(
    'Seed reset: users=' || l_users || ', portfolio=' || l_portfolio ||
    ', transactions=' || l_transactions || ', luxury_items=' || l_luxury_items
  );
END;
/
COMMIT;
PROMPT === [SUCCESS] LuminaForge demo data reset complete ===

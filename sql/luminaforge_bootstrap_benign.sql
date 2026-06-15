-- ========================================================================
-- LuminaForge benign SQL bootstrap (run from Oracle_DB_Demo_Control_Grant.sql)
-- Executes as user luminaforge so SQL Firewall capture logs training traffic.
-- Covers all query shapes used by the 4 vulnerable routes + safe portfolio.
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

CREATE OR REPLACE PROCEDURE luminaforge.aegis_demo_bootstrap_benign
AUTHID DEFINER
AS
  l_n        NUMBER;
  l_username luminaforge.users.username%TYPE;
  l_role     luminaforge.users.role%TYPE;
BEGIN
  -- ── Portfolio (safe route) ─────────────────────────────────
  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.portfolio
  WHERE  user_id = 1;

  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.portfolio
  WHERE  UPPER(symbol) LIKE '%ORCL%';

  -- ── Market search (Point 1 benign shape) ──────────────────
  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.luxury_items
  WHERE  name LIKE '%Rolex%';

  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.luxury_items
  WHERE  name LIKE '%watch%';

  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.luxury_items
  WHERE  category = 'watch';

  -- ── Transaction filter (Point 2 benign shape) ─────────────
  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.transactions
  WHERE  user_id = 1;

  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.transactions
  WHERE  user_id = 1 AND type = 'BUY';

  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.transactions
  WHERE  user_id = 1 AND type = 'SELL';

  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.transactions
  WHERE  user_id = 1 AND type = 'DIVIDEND';

  -- ── Statement generator (Point 3 benign shape) ────────────
  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.transactions
  WHERE  user_id = 1;

  -- ── Users (safe probe + navbar session API shape) ────────
  SELECT COUNT(*) INTO l_n
  FROM   luminaforge.users
  WHERE  username = 'demo_user' AND password IS NOT NULL;

  SELECT username, role
  INTO   l_username, l_role
  FROM   luminaforge.users
  WHERE  id = 1;

  SELECT 1 INTO l_n FROM dual;
END aegis_demo_bootstrap_benign;
/

GRANT EXECUTE ON luminaforge.aegis_demo_bootstrap_benign TO SYS;
GRANT EXECUTE ON luminaforge.aegis_demo_bootstrap_benign TO AEGIS_APP;

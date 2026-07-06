-- ========================================================================
-- LuminaForge transaction-only demo reset (shared by reset-demo-data.sql
-- and SYS.aegis_demo_control.reinit_default_transaction_data)
-- Run from Oracle_DB_Demo_Control_Grant.sql as SYS.
-- Restores transactions baseline only — does NOT reset user roles.
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

CREATE OR REPLACE PROCEDURE luminaforge.aegis_demo_reinit_transactions
AUTHID DEFINER
AS
BEGIN
  EXECUTE IMMEDIATE 'ALTER SESSION SET CURRENT_SCHEMA = luminaforge';

  DELETE FROM luminaforge.transactions WHERE type = 'BULK';

  BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE luminaforge.transactions ADD (asset VARCHAR2(40))';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLCODE != -1430 THEN
        RAISE;
      END IF;
  END;

  UPDATE luminaforge.transactions SET asset = 'ORCL'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 74000;
  UPDATE luminaforge.transactions SET asset = 'NVDA'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 49600;
  UPDATE luminaforge.transactions SET asset = 'TSLA'  WHERE user_id = 1 AND type = 'SELL'      AND amount = 22800;
  UPDATE luminaforge.transactions SET asset = 'SPY'   WHERE user_id = 1 AND type = 'DIVIDEND'  AND amount = 3680;
  UPDATE luminaforge.transactions SET asset = 'META'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 98000;
  UPDATE luminaforge.transactions SET asset = 'VTI'   WHERE user_id = 1 AND type = 'REBALANCE' AND amount = 15000;
  UPDATE luminaforge.transactions SET asset = 'AAPL'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 27825;
  UPDATE luminaforge.transactions SET asset = 'JPM'   WHERE user_id = 1 AND type = 'INTEREST'  AND amount = 2190;
  UPDATE luminaforge.transactions SET asset = 'AMZN'  WHERE user_id = 1 AND type = 'SELL'      AND amount = 18200;
  UPDATE luminaforge.transactions SET asset = 'QQQ'   WHERE user_id = 1 AND type = 'DIVIDEND'  AND amount = 1240;
  UPDATE luminaforge.transactions SET asset = 'BTC'   WHERE user_id = 1 AND type = 'BUY'       AND amount = 53400;
  UPDATE luminaforge.transactions SET asset = 'CASH'  WHERE user_id = 1 AND type = 'TRANSFER' AND amount = 5000;

  DELETE FROM luminaforge.transactions WHERE user_id IN (3, 4, 5, 8, 9);

  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'WIRE',   4750000, 'WIRE-APAC', SYSTIMESTAMP - INTERVAL '14' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'BUY',     890000, 'ORCL',      SYSTIMESTAMP - INTERVAL '9'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'WIRE',  12300000, 'WIRE-US',   SYSTIMESTAMP - INTERVAL '11' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'SETTLE',  3200000, 'USD-SETTLE', SYSTIMESTAMP - INTERVAL '6'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'FX',     2100000, 'EUR/USD',   SYSTIMESTAMP - INTERVAL '7'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'SELL',    780000, 'GS',        SYSTIMESTAMP - INTERVAL '3'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'WIRE',   9500000, 'WIRE-PRIVATE', SYSTIMESTAMP - INTERVAL '15' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'BUY',    1840000, 'NVDA',         SYSTIMESTAMP - INTERVAL '4'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'SETTLE',18750000, 'SETTLE-HF', SYSTIMESTAMP - INTERVAL '20' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'BUY',    5600000, 'BRK.B',     SYSTIMESTAMP - INTERVAL '1'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'SELL',    412000, 'BABA',      SYSTIMESTAMP - INTERVAL '13' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'DIVIDEND',  28500, 'TSM',       SYSTIMESTAMP - INTERVAL '10' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'BUY',     156000, 'FXI',       SYSTIMESTAMP - INTERVAL '5'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'TRANSFER', 89000, 'CASH',      SYSTIMESTAMP - INTERVAL '2'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'BUY',     640000, 'JPM',       SYSTIMESTAMP - INTERVAL '12' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'DIVIDEND',  42000, 'V',         SYSTIMESTAMP - INTERVAL '8'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'SELL',    288000, 'GLD',       SYSTIMESTAMP - INTERVAL '4'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'INTEREST',  18500, 'BRK.B',     SYSTIMESTAMP - INTERVAL '1'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'BUY',     925000, 'LVMH',      SYSTIMESTAMP - INTERVAL '11' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'WIRE',    1800000, 'WIRE-EU',   SYSTIMESTAMP - INTERVAL '9'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'DIVIDEND',  31000, 'MS',        SYSTIMESTAMP - INTERVAL '5'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'REBALANCE',142000, 'GS',        SYSTIMESTAMP - INTERVAL '2'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'SELL',    520000, 'AAPL',      SYSTIMESTAMP - INTERVAL '13' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'BUY',     890000, 'BTC',       SYSTIMESTAMP - INTERVAL '10' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'TRANSFER',250000, 'CASH',      SYSTIMESTAMP - INTERVAL '6'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'DIVIDEND',  48000, 'NVDA',      SYSTIMESTAMP - INTERVAL '2'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'SELL',   3200000, 'SPY',       SYSTIMESTAMP - INTERVAL '14' DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'BUY',    1450000, 'QQQ',       SYSTIMESTAMP - INTERVAL '8'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'REBALANCE',680000, 'TLT',       SYSTIMESTAMP - INTERVAL '4'  DAY);
  INSERT INTO luminaforge.transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'WIRE',   4200000, 'WIRE-HF',   SYSTIMESTAMP - INTERVAL '1'  DAY);

  COMMIT;
END aegis_demo_reinit_transactions;
/

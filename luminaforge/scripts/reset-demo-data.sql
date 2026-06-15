-- ========================================================================
-- LuminaForge Demo Data Reset Script
-- Run after attack demos (especially Point 4 stacked query) to restore
-- repeatable demo state without requiring a full schema re-deploy.
-- Execute as SYS or as the luminaforge user in PDB AHDB2605_PDB1.
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;
ALTER SESSION SET CURRENT_SCHEMA = luminaforge;

-- 1. Restore all user roles to their seeded baseline
--    (undoes Point 4 privilege-escalation payloads)
UPDATE users SET role = 'premium'    WHERE username = 'demo_user';
UPDATE users SET role = 'admin'      WHERE username = 'admin';
UPDATE users SET role = 'premium'    WHERE username = 'j.chen';
UPDATE users SET role = 'vip'        WHERE username = 'm.vanderbilt';
UPDATE users SET role = 'premium'    WHERE username = 'r.sterling';
UPDATE users SET role = 'audit'      WHERE username = 'sys_audit';
UPDATE users SET role = 'compliance' WHERE username = 'compliance_bot';
UPDATE users SET role = 'vip'        WHERE username = 'e.ashworth';
UPDATE users SET role = 'vip'        WHERE username = 'a.rothschild';
UPDATE users SET role = 'service'    WHERE username = 'trade_engine';
UPDATE users SET role = 'vip'        WHERE username = 'j.rockefeller';
UPDATE users SET role = 'risk'       WHERE username = 'risk_monitor';
UPDATE users SET role = 'premium'    WHERE username = 'k.morgan';
UPDATE users SET role = 'vip'        WHERE username = 's.blackwell';
UPDATE users SET role = 'vip'        WHERE username = 'l.dupont';
UPDATE users SET role = 'vip'        WHERE username = 'h.windsor';
UPDATE users SET role = 'vip'        WHERE username = 'p.gates_family';
UPDATE users SET role = 'premium'    WHERE username = 'n.buffett_trust';
UPDATE users SET role = 'premium'    WHERE username = 'f.marsdorf';
UPDATE users SET role = 'vip'        WHERE username = 'c.carnegie_heir';
UPDATE users SET role = 'compliance' WHERE username = 'treasury_ops';
UPDATE users SET role = 'risk'       WHERE username = 'aml_scanner';
UPDATE users SET role = 'service'    WHERE username = 'settlement_svc';
UPDATE users SET role = 'service'    WHERE username = 'wealth_api';
UPDATE users SET role = 'service'    WHERE username = 'tax_filing_bot';
UPDATE users SET role = 'service'    WHERE username = 'portfolio_rebal';
UPDATE users SET role = 'audit'      WHERE username = 'kyc_reviewer';

-- 1c. Core roster (insert if missing — e.g. PDBs that only have demo_user)
INSERT INTO users (username, password, role)
SELECT 'admin', 'Sup3rSecretAdmin#', 'admin' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
INSERT INTO users (username, password, role)
SELECT 'j.chen', 'As1aPacific!Mgr', 'premium' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'j.chen');
INSERT INTO users (username, password, role)
SELECT 'm.vanderbilt', 'OldM0ney$1899', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'm.vanderbilt');
INSERT INTO users (username, password, role)
SELECT 'r.sterling', 'L0nd0nDesk#FX', 'premium' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'r.sterling');
INSERT INTO users (username, password, role)
SELECT 'sys_audit', '@udit$ystem26ai', 'audit' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'sys_audit');
INSERT INTO users (username, password, role)
SELECT 'compliance_bot', 'C0mpl1@nce#RO', 'compliance' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'compliance_bot');
INSERT INTO users (username, password, role)
SELECT 'e.ashworth', 'Pvt#Bank1ng!', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'e.ashworth');
INSERT INTO users (username, password, role)
SELECT 'a.rothschild', 'HeritageF0nd!', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'a.rothschild');
INSERT INTO users (username, password, role)
SELECT 'trade_engine', 'Tr@deEngine#01', 'service' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'trade_engine');
INSERT INTO users (username, password, role)
SELECT 'j.rockefeller', 'Dynast1c$Ofc!', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'j.rockefeller');
INSERT INTO users (username, password, role)
SELECT 'risk_monitor', 'R1sk@M0n1tor!', 'risk' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'risk_monitor');

-- 1b. Extended user roster for Attack Point 3 (15 additional accounts)
INSERT INTO users (username, password, role)
SELECT 'k.morgan', 'M0rg@nDesk#NY', 'premium' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'k.morgan');
INSERT INTO users (username, password, role)
SELECT 's.blackwell', 'Blackw3ll$Ofc', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 's.blackwell');
INSERT INTO users (username, password, role)
SELECT 'l.dupont', 'DuP0ntHeir!', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'l.dupont');
INSERT INTO users (username, password, role)
SELECT 'h.windsor', 'W1ndsorTrust#', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'h.windsor');
INSERT INTO users (username, password, role)
SELECT 'p.gates_family', 'F@milyOff1ce!', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'p.gates_family');
INSERT INTO users (username, password, role)
SELECT 'n.buffett_trust', 'Trust3e#2026', 'premium' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'n.buffett_trust');
INSERT INTO users (username, password, role)
SELECT 'f.marsdorf', 'Marsd0rf$CH', 'premium' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'f.marsdorf');
INSERT INTO users (username, password, role)
SELECT 'c.carnegie_heir', 'Carneg1e#Fund', 'vip' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'c.carnegie_heir');
INSERT INTO users (username, password, role)
SELECT 'treasury_ops', 'Tr3asury@Ops', 'compliance' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'treasury_ops');
INSERT INTO users (username, password, role)
SELECT 'aml_scanner', 'AML$canner26', 'risk' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'aml_scanner');
INSERT INTO users (username, password, role)
SELECT 'settlement_svc', 'S3ttlement#01', 'service' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'settlement_svc');
INSERT INTO users (username, password, role)
SELECT 'wealth_api', 'We@lthAPI#Key', 'service' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'wealth_api');
INSERT INTO users (username, password, role)
SELECT 'tax_filing_bot', 'TaxF1le$B0t', 'service' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'tax_filing_bot');
INSERT INTO users (username, password, role)
SELECT 'portfolio_rebal', 'Rebal#Engine2', 'service' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'portfolio_rebal');
INSERT INTO users (username, password, role)
SELECT 'kyc_reviewer', 'KYC_R3view!', 'audit' FROM dual
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'kyc_reviewer');

-- 1a. Password column for Attack Point 3 (Tax Statement UNION credential leak)
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE users ADD (password VARCHAR2(100))';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -1430 THEN
      RAISE;
    END IF;
END;
/

UPDATE users SET password = 'Wealth#2026!'       WHERE username = 'demo_user';
UPDATE users SET password = 'Sup3rSecretAdmin#'   WHERE username = 'admin';
UPDATE users SET password = 'As1aPacific!Mgr'     WHERE username = 'j.chen';
UPDATE users SET password = 'OldM0ney$1899'       WHERE username = 'm.vanderbilt';
UPDATE users SET password = 'L0nd0nDesk#FX'       WHERE username = 'r.sterling';
UPDATE users SET password = '@udit$ystem26ai'     WHERE username = 'sys_audit';
UPDATE users SET password = 'C0mpl1@nce#RO'      WHERE username = 'compliance_bot';
UPDATE users SET password = 'Pvt#Bank1ng!'        WHERE username = 'e.ashworth';
UPDATE users SET password = 'HeritageF0nd!'       WHERE username = 'a.rothschild';
UPDATE users SET password = 'Tr@deEngine#01'      WHERE username = 'trade_engine';
UPDATE users SET password = 'Dynast1c$Ofc!'       WHERE username = 'j.rockefeller';
UPDATE users SET password = 'R1sk@M0n1tor!'       WHERE username = 'risk_monitor';
UPDATE users SET password = 'M0rg@nDesk#NY'       WHERE username = 'k.morgan';
UPDATE users SET password = 'Blackw3ll$Ofc'       WHERE username = 's.blackwell';
UPDATE users SET password = 'DuP0ntHeir!'         WHERE username = 'l.dupont';
UPDATE users SET password = 'W1ndsorTrust#'       WHERE username = 'h.windsor';
UPDATE users SET password = 'F@milyOff1ce!'       WHERE username = 'p.gates_family';
UPDATE users SET password = 'Trust3e#2026'        WHERE username = 'n.buffett_trust';
UPDATE users SET password = 'Marsd0rf$CH'         WHERE username = 'f.marsdorf';
UPDATE users SET password = 'Carneg1e#Fund'       WHERE username = 'c.carnegie_heir';
UPDATE users SET password = 'Tr3asury@Ops'        WHERE username = 'treasury_ops';
UPDATE users SET password = 'AML$canner26'        WHERE username = 'aml_scanner';
UPDATE users SET password = 'S3ttlement#01'       WHERE username = 'settlement_svc';
UPDATE users SET password = 'We@lthAPI#Key'         WHERE username = 'wealth_api';
UPDATE users SET password = 'TaxF1le$B0t'          WHERE username = 'tax_filing_bot';
UPDATE users SET password = 'Rebal#Engine2'        WHERE username = 'portfolio_rebal';
UPDATE users SET password = 'KYC_R3view!'          WHERE username = 'kyc_reviewer';

-- 2. Remove any BULK transactions injected by Point 4 attack demos
DELETE FROM transactions WHERE type = 'BULK';

-- 2a. Asset column for Transaction History ledger (idempotent on existing PDBs)
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE transactions ADD (asset VARCHAR2(40))';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -1430 THEN
      RAISE;
    END IF;
END;
/

UPDATE transactions SET asset = 'ORCL'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 74000;
UPDATE transactions SET asset = 'NVDA'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 49600;
UPDATE transactions SET asset = 'TSLA'  WHERE user_id = 1 AND type = 'SELL'      AND amount = 22800;
UPDATE transactions SET asset = 'SPY'   WHERE user_id = 1 AND type = 'DIVIDEND'  AND amount = 3680;
UPDATE transactions SET asset = 'META'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 98000;
UPDATE transactions SET asset = 'VTI'   WHERE user_id = 1 AND type = 'REBALANCE' AND amount = 15000;
UPDATE transactions SET asset = 'AAPL'  WHERE user_id = 1 AND type = 'BUY'       AND amount = 27825;
UPDATE transactions SET asset = 'JPM'   WHERE user_id = 1 AND type = 'INTEREST'  AND amount = 2190;
UPDATE transactions SET asset = 'AMZN'  WHERE user_id = 1 AND type = 'SELL'      AND amount = 18200;
UPDATE transactions SET asset = 'QQQ'   WHERE user_id = 1 AND type = 'DIVIDEND'  AND amount = 1240;
UPDATE transactions SET asset = 'BTC'   WHERE user_id = 1 AND type = 'BUY'       AND amount = 53400;
UPDATE transactions SET asset = 'CASH'  WHERE user_id = 1 AND type = 'TRANSFER' AND amount = 5000;

-- 2b. Cross-client ledger rows for Attack Point 2 (Transaction History injection demo)
--     30 rows (6 per user_id 3, 4, 5, 8, 9). Without these, x' OR user_id<>1 -- leaks nothing.
DELETE FROM transactions WHERE user_id IN (3, 4, 5, 8, 9);

INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'WIRE',   4750000, 'WIRE-APAC', SYSTIMESTAMP - INTERVAL '14' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'BUY',     890000, 'ORCL',      SYSTIMESTAMP - INTERVAL '9'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'WIRE',  12300000, 'WIRE-US',   SYSTIMESTAMP - INTERVAL '11' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'SETTLE',  3200000, 'USD-SETTLE', SYSTIMESTAMP - INTERVAL '6'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'FX',     2100000, 'EUR/USD',   SYSTIMESTAMP - INTERVAL '7'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'SELL',    780000, 'GS',        SYSTIMESTAMP - INTERVAL '3'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'WIRE',   9500000, 'WIRE-PRIVATE', SYSTIMESTAMP - INTERVAL '15' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'BUY',    1840000, 'NVDA',         SYSTIMESTAMP - INTERVAL '4'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'SETTLE',18750000, 'SETTLE-HF', SYSTIMESTAMP - INTERVAL '20' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'BUY',    5600000, 'BRK.B',     SYSTIMESTAMP - INTERVAL '1'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'SELL',    412000, 'BABA',      SYSTIMESTAMP - INTERVAL '13' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'DIVIDEND',  28500, 'TSM',       SYSTIMESTAMP - INTERVAL '10' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'BUY',     156000, 'FXI',       SYSTIMESTAMP - INTERVAL '5'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'TRANSFER', 89000, 'CASH',      SYSTIMESTAMP - INTERVAL '2'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'BUY',     640000, 'JPM',       SYSTIMESTAMP - INTERVAL '12' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'DIVIDEND',  42000, 'V',         SYSTIMESTAMP - INTERVAL '8'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'SELL',    288000, 'GLD',       SYSTIMESTAMP - INTERVAL '4'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'INTEREST',  18500, 'BRK.B',     SYSTIMESTAMP - INTERVAL '1'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'BUY',     925000, 'LVMH',      SYSTIMESTAMP - INTERVAL '11' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'WIRE',    1800000, 'WIRE-EU',   SYSTIMESTAMP - INTERVAL '9'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'DIVIDEND',  31000, 'MS',        SYSTIMESTAMP - INTERVAL '5'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'REBALANCE',142000, 'GS',        SYSTIMESTAMP - INTERVAL '2'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'SELL',    520000, 'AAPL',      SYSTIMESTAMP - INTERVAL '13' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'BUY',     890000, 'BTC',       SYSTIMESTAMP - INTERVAL '10' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'TRANSFER',250000, 'CASH',      SYSTIMESTAMP - INTERVAL '6'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'DIVIDEND',  48000, 'NVDA',      SYSTIMESTAMP - INTERVAL '2'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'SELL',   3200000, 'SPY',       SYSTIMESTAMP - INTERVAL '14' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'BUY',    1450000, 'QQQ',       SYSTIMESTAMP - INTERVAL '8'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'REBALANCE',680000, 'TLT',       SYSTIMESTAMP - INTERVAL '4'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'WIRE',   4200000, 'WIRE-HF',   SYSTIMESTAMP - INTERVAL '1'  DAY);

-- 2c. Cross-client portfolio positions (20 rows — user_id 3, 4, 5, 8, 9)
DELETE FROM portfolio WHERE user_id IN (3, 4, 5, 8, 9);

INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'ORCL',  1200,  142.50);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'BABA',   800,   88.20);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'TSM',    600,  128.40);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'FXI',   1500,   28.90);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'BRK.B',  350,  392.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'JPM',    900,  201.30);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'V',      700,  272.80);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'GLD',   2200,  218.50);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (5, 'GS',     450,  455.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (5, 'MS',     520,  102.40);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (5, 'EUR/USD', 1,     1.08);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (5, 'LVMH',   180,  785.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (8, 'NVDA',   420,  615.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (8, 'AAPL',   300,  188.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (8, 'BTC',     12, 57500.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (8, 'ETH',     85,  3050.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (9, 'BRK.B',  800,  388.50);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (9, 'SPY',   2500,  488.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (9, 'QQQ',   1800,  418.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (9, 'TLT',   3200,   94.20);

-- 3. Verify final state
PROMPT
PROMPT === Users (should show all 27 with correct roles) ===
SELECT id, username, role,
       CASE WHEN password IS NOT NULL THEN '[set]' END AS password_set
FROM users ORDER BY id;

PROMPT
PROMPT === Transactions per user (should show no BULK rows) ===
SELECT user_id, type, COUNT(*) AS cnt, SUM(amount) AS total
FROM transactions
GROUP BY user_id, type
ORDER BY user_id, type;

PROMPT
PROMPT === Portfolio positions per user (expect 20 for user_id 3,4,5,8,9) ===
SELECT user_id, COUNT(*) AS positions FROM portfolio GROUP BY user_id ORDER BY user_id;

COMMIT;

PROMPT
PROMPT === [SUCCESS] LuminaForge demo data reset complete ===

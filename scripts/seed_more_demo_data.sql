-- ========================================================================
-- Add More Seeded Assets to demo_user (additive — safe on existing DB)
-- Run as SYS or luminaforge user in PDB AHDB2605_PDB1
-- Does NOT delete existing rows — purely additive INSERT.
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;
ALTER SESSION SET CURRENT_SCHEMA = luminaforge;

-- ── Portfolio: 8 new positions for demo_user (user_id 1) ─────────────────
-- Equities (new)
INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'META', 100, 480.00 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='META');

INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'GOOGL', 55, 168.90 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='GOOGL');

INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'V', 130, 270.50 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='V');

-- ETFs (new)
INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'SPY', 200, 490.00 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='SPY');

INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'QQQ', 150, 420.30 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='QQQ');

INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'VTI', 180, 235.60 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='VTI');

-- Commodities (new)
INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'SILVER', 2000, 28.50 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='SILVER');

-- Crypto (new)
INSERT INTO portfolio (user_id, symbol, quantity, avg_price)
  SELECT 1, 'SOL', 120, 145.00 FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM portfolio WHERE user_id=1 AND symbol='SOL');

-- ── Transactions: 7 more rows for demo_user (user_id 1) ──────────────────
INSERT INTO transactions (user_id, type, amount, timestamp) VALUES (1, 'BUY',       74000, SYSTIMESTAMP - INTERVAL '30' DAY);
INSERT INTO transactions (user_id, type, amount, timestamp) VALUES (1, 'SELL',      22800, SYSTIMESTAMP - INTERVAL '22' DAY);
INSERT INTO transactions (user_id, type, amount, timestamp) VALUES (1, 'DIVIDEND',   3680, SYSTIMESTAMP - INTERVAL '20' DAY);
INSERT INTO transactions (user_id, type, amount, timestamp) VALUES (1, 'BUY',       98000, SYSTIMESTAMP - INTERVAL '18' DAY);
INSERT INTO transactions (user_id, type, amount, timestamp) VALUES (1, 'REBALANCE', 15000, SYSTIMESTAMP - INTERVAL '15' DAY);
INSERT INTO transactions (user_id, type, amount, timestamp) VALUES (1, 'INTEREST',   2190, SYSTIMESTAMP - INTERVAL '10' DAY);
INSERT INTO transactions (user_id, type, amount, timestamp) VALUES (1, 'BUY',       53400, SYSTIMESTAMP - INTERVAL '3'  DAY);

-- ── Market Instruments: 8 additive rows ───────────────────────────────────
INSERT INTO luxury_items (name, price, category)
  SELECT 'JPMorgan Chase (JPM)', 198.60, 'stock' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='JPMorgan Chase (JPM)');

INSERT INTO luxury_items (name, price, category)
  SELECT 'US Treasury Bill 6M', 99.40, 'bond' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='US Treasury Bill 6M');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Invesco QQQ Trust (QQQ)', 418.00, 'etf' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Invesco QQQ Trust (QQQ)');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Vanguard Total Market ETF (VTI)', 235.60, 'etf' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Vanguard Total Market ETF (VTI)');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Ethereum (ETH)', 3620.00, 'crypto' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Ethereum (ETH)');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Gold Spot (XAU)', 2280.00, 'metal' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Gold Spot (XAU)');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Silver Spot (XAG)', 28.50, 'metal' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Silver Spot (XAG)');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Corporate Bond ETF (LQD)', 109.30, 'bond_etf' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Corporate Bond ETF (LQD)');

COMMIT;

-- ── Verification ──────────────────────────────────────────────────────────
PROMPT
PROMPT === Portfolio for demo_user (should show 20 positions) ===
SELECT symbol, quantity, avg_price,
       ROUND(quantity * avg_price, 0) AS market_value
FROM   portfolio
WHERE  user_id = 1
ORDER BY market_value DESC;

PROMPT
PROMPT === Transactions for demo_user (should show 12+ rows) ===
SELECT TO_CHAR(timestamp, 'DD-Mon-YYYY') AS dt, type, amount
FROM   transactions
WHERE  user_id = 1
ORDER BY timestamp DESC;

PROMPT
PROMPT === Market instruments in luxury_items (should show 20+ rows) ===
SELECT name, price, category FROM luxury_items ORDER BY category, price DESC;

PROMPT
PROMPT === [SUCCESS] Additional demo data seeded ===

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

-- ── Luxury Items: 8 new items ─────────────────────────────────────────────
INSERT INTO luxury_items (name, price, category)
  SELECT 'Audemars Piguet Royal Oak Offshore', 98000, 'watch' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Audemars Piguet Royal Oak Offshore');

INSERT INTO luxury_items (name, price, category)
  SELECT 'A. Lange & Söhne Zeitwerk', 175000, 'watch' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='A. Lange & Söhne Zeitwerk');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Rolls-Royce Spectre EV', 420000, 'vehicle' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Rolls-Royce Spectre EV');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Bugatti Chiron Super Sport', 3800000, 'vehicle' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Bugatti Chiron Super Sport');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Gulfstream G700 Private Jet', 75000000, 'aviation' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Gulfstream G700 Private Jet');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Banksy "Girl with Balloon" (orig)', 1200000, 'art' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Banksy "Girl with Balloon" (orig)');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Cartier Panthère Necklace', 320000, 'jewelry' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Cartier Panthère Necklace');

INSERT INTO luxury_items (name, price, category)
  SELECT 'Aspen Mountain Chalet — 8BR', 22800000, 'real_estate' FROM dual
  WHERE NOT EXISTS (SELECT 1 FROM luxury_items WHERE name='Aspen Mountain Chalet — 8BR');

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
PROMPT === Luxury Items (should show 20 items) ===
SELECT name, price, category FROM luxury_items ORDER BY category, price DESC;

PROMPT
PROMPT === [SUCCESS] Additional demo data seeded ===

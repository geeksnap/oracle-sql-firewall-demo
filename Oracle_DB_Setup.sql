-- ========================================================================
-- Oracle AI Database 26ai SQL Firewall Setup (Production-Ready Demo Script)
-- Target: Dedicated PDB Instance
-- Execution Mode: Run as SYS AS SYSDBA using "Run Script (F5)"
-- Last Update: 01-Jun-2026
-- ========================================================================

-- 1. Setup Environment Controls for Full Query and Feedback Visibility

-- Force the client to display each SQL statement being executed
SET ECHO ON
-- Output execution summary messages (e.g., 'Table created')
SET FEEDBACK ON
-- Enable output routing for DBMS_OUTPUT messages
SET SERVEROUTPUT ON

-- 2. Target Container Routing
-- NOTE: Replace 'AHDB2605_PDB1;' with your actual PDB service name if different
ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

-- 3. Core Security Principals (Users) Creation
CREATE USER AEGIS_APP IDENTIFIED BY "OracleFWDemo-123#";
CREATE USER luminaforge IDENTIFIED BY "OracleFWDemo-123#";

-- 4. Storage and Session Allocation
GRANT CONNECT, RESOURCE, CREATE SESSION TO AEGIS_APP;
GRANT CONNECT, RESOURCE, CREATE SESSION TO luminaforge;
ALTER USER AEGIS_APP QUOTA UNLIMITED ON users;
ALTER USER luminaforge QUOTA UNLIMITED ON users;

-- 5. Cross-Monitoring Authorization (Granting Dictionary View access to Aegis SOC)
-- Optimized using the Oracle 23c/26ai built-in monitoring role to eliminate view-name errors
GRANT SQL_FIREWALL_VIEWER TO AEGIS_APP;

-- 6. Context Switch for LuminaForge Data Layer Deployment
ALTER SESSION SET CURRENT_SCHEMA = luminaforge;

-- 7. Schema Architecture Construction (LuminaForge App Tables)
CREATE TABLE users (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
    username VARCHAR2(50), 
    password VARCHAR2(100), 
    role VARCHAR2(20)
);

CREATE TABLE portfolio (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
    user_id NUMBER, 
    symbol VARCHAR2(20), 
    quantity NUMBER, 
    avg_price NUMBER
);

CREATE TABLE transactions (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
    user_id NUMBER, 
    type VARCHAR2(20), 
    amount NUMBER, 
    asset VARCHAR2(40),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE luxury_items (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
    name VARCHAR2(100), 
    price NUMBER, 
    category VARCHAR2(50)
);

-- 8. Seed Data Population
-- ── 8a. Users (27 accounts — mix of premium clients + system accounts) ──
-- NOTE: IDs are IDENTITY-generated in insertion order (1-27).
-- These accounts are deliberately designed to look like a real private-bank
-- user table so the Point 3 UNION credential leak is dramatically impactful.
INSERT INTO users (username, password, role) VALUES ('demo_user',     'Wealth#2026!',      'premium');    -- id 1  (session user)
INSERT INTO users (username, password, role) VALUES ('admin',         'Sup3rSecretAdmin#', 'admin');      -- id 2
INSERT INTO users (username, password, role) VALUES ('j.chen',        'As1aPacific!Mgr',   'premium');    -- id 3
INSERT INTO users (username, password, role) VALUES ('m.vanderbilt',  'OldM0ney$1899',     'vip');        -- id 4
INSERT INTO users (username, password, role) VALUES ('r.sterling',    'L0nd0nDesk#FX',     'premium');    -- id 5
INSERT INTO users (username, password, role) VALUES ('sys_audit',     '@udit$ystem26ai',   'audit');      -- id 6  (system account)
INSERT INTO users (username, password, role) VALUES ('compliance_bot','C0mpl1@nce#RO',     'compliance'); -- id 7  (system account)
INSERT INTO users (username, password, role) VALUES ('e.ashworth',    'Pvt#Bank1ng!',      'vip');        -- id 8
INSERT INTO users (username, password, role) VALUES ('a.rothschild',  'HeritageF0nd!',     'vip');        -- id 9
INSERT INTO users (username, password, role) VALUES ('trade_engine',  'Tr@deEngine#01',    'service');    -- id 10 (system account)
INSERT INTO users (username, password, role) VALUES ('j.rockefeller', 'Dynast1c$Ofc!',     'vip');        -- id 11
INSERT INTO users (username, password, role) VALUES ('risk_monitor',  'R1sk@M0n1tor!',     'risk');       -- id 12 (system account)
INSERT INTO users (username, password, role) VALUES ('k.morgan',        'M0rg@nDesk#NY',     'premium');    -- id 13
INSERT INTO users (username, password, role) VALUES ('s.blackwell',     'Blackw3ll$Ofc',     'vip');        -- id 14
INSERT INTO users (username, password, role) VALUES ('l.dupont',        'DuP0ntHeir!',       'vip');        -- id 15
INSERT INTO users (username, password, role) VALUES ('h.windsor',       'W1ndsorTrust#',     'vip');        -- id 16
INSERT INTO users (username, password, role) VALUES ('p.gates_family',  'F@milyOff1ce!',   'vip');        -- id 17
INSERT INTO users (username, password, role) VALUES ('n.buffett_trust', 'Trust3e#2026',      'premium');    -- id 18
INSERT INTO users (username, password, role) VALUES ('f.marsdorf',      'Marsd0rf$CH',       'premium');    -- id 19
INSERT INTO users (username, password, role) VALUES ('c.carnegie_heir', 'Carneg1e#Fund',     'vip');        -- id 20
INSERT INTO users (username, password, role) VALUES ('treasury_ops',    'Tr3asury@Ops',      'compliance'); -- id 21
INSERT INTO users (username, password, role) VALUES ('aml_scanner',     'AML$canner26',      'risk');       -- id 22
INSERT INTO users (username, password, role) VALUES ('settlement_svc',  'S3ttlement#01',     'service');    -- id 23
INSERT INTO users (username, password, role) VALUES ('wealth_api',      'We@lthAPI#Key',      'service');    -- id 24
INSERT INTO users (username, password, role) VALUES ('tax_filing_bot',  'TaxF1le$B0t',       'service');    -- id 25
INSERT INTO users (username, password, role) VALUES ('portfolio_rebal', 'Rebal#Engine2',     'service');    -- id 26
INSERT INTO users (username, password, role) VALUES ('kyc_reviewer',    'KYC_R3view!',       'audit');      -- id 27

-- ── 8b. Portfolio (20 positions for demo_user / user_id 1) ──────────────
-- Equities
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'AAPL',   150,  185.50);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'ORCL',   200,  138.30);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'NVDA',    80,  620.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'MSFT',   120,  380.25);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'TSLA',    60,  195.80);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'AMZN',    90,  178.40);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'META',   100,  480.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'GOOGL',   55,  168.90);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'V',      130,  270.50);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'JPM',    110,  198.60);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'GS',      75,  460.10);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'BRK.B',   40,  389.70);
-- ETFs
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'SPY',    200,  490.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'QQQ',    150,  420.30);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'VTI',    180,  235.60);
-- Commodities
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'GOLD',   500,    2280);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'SILVER', 2000,    28.50);
-- Crypto
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'BTC',      2,  58200);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'ETH',     18,   3100);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (1, 'SOL',    120,   145.00);

-- ── 8b-ii. Portfolio — 20 positions for other clients (user_id 3, 4, 5, 8, 9) ──
-- Aligns with cross-client transaction / institutional demo personas
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'ORCL',  1200,  142.50);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'BABA',   800,   88.20);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'TSM',    600,  128.40);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (3, 'FXI',   1500,   28.90);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'BRK.B',  350,  392.00);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'JPM',    900,  201.30);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'V',      700,  272.80);
INSERT INTO portfolio (user_id, symbol, quantity, avg_price) VALUES (4, 'GLD',   2200,   218.50);
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

-- ── 8c. Transactions (27 rows across multiple users) ────────────────────
-- user_id 1 (demo_user) — 12 rows visible by default in Point 2 benign search
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'BUY',       74000, 'ORCL',  SYSTIMESTAMP - INTERVAL '30' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'BUY',       49600, 'NVDA',  SYSTIMESTAMP - INTERVAL '25' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'SELL',      22800, 'TSLA',  SYSTIMESTAMP - INTERVAL '22' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'DIVIDEND',   3680, 'SPY',   SYSTIMESTAMP - INTERVAL '20' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'BUY',       98000, 'META',  SYSTIMESTAMP - INTERVAL '18' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'REBALANCE', 15000, 'VTI',   SYSTIMESTAMP - INTERVAL '15' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'BUY',       27825, 'AAPL',  SYSTIMESTAMP - INTERVAL '12' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'INTEREST',   2190, 'JPM',   SYSTIMESTAMP - INTERVAL '10' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'SELL',      18200, 'AMZN',  SYSTIMESTAMP - INTERVAL '8'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'DIVIDEND',   1240, 'QQQ',   SYSTIMESTAMP - INTERVAL '5'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'BUY',       53400, 'BTC',   SYSTIMESTAMP - INTERVAL '3'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (1, 'TRANSFER',   5000, 'CASH',  SYSTIMESTAMP - INTERVAL '2'  DAY);
-- user_id 3 (j.chen) — leaked by Point 2 injection: x' OR user_id<>1 --
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'WIRE',   4750000, 'WIRE-APAC', SYSTIMESTAMP - INTERVAL '14' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (3, 'BUY',     890000, 'ORCL',      SYSTIMESTAMP - INTERVAL '9'  DAY);
-- user_id 4 (m.vanderbilt) — leaked by Point 2 injection
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'WIRE',  12300000, 'WIRE-US',   SYSTIMESTAMP - INTERVAL '11' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (4, 'SETTLE', 3200000, 'USD-SETTLE', SYSTIMESTAMP - INTERVAL '6'  DAY);
-- user_id 5 (r.sterling) — leaked by Point 2 injection
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'FX',     2100000, 'EUR/USD',   SYSTIMESTAMP - INTERVAL '7'  DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (5, 'SELL',    780000, 'GS',        SYSTIMESTAMP - INTERVAL '3'  DAY);
-- user_id 8 (e.ashworth) — leaked by Point 2 injection
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'WIRE',   9500000, 'WIRE-PRIVATE', SYSTIMESTAMP - INTERVAL '15' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (8, 'BUY',    1840000, 'NVDA',         SYSTIMESTAMP - INTERVAL '4'  DAY);
-- user_id 9 (a.rothschild) — leaked by Point 2 injection
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'SETTLE',18750000, 'SETTLE-HF', SYSTIMESTAMP - INTERVAL '20' DAY);
INSERT INTO transactions (user_id, type, amount, asset, timestamp) VALUES (9, 'BUY',    5600000, 'BRK.B',     SYSTIMESTAMP - INTERVAL '1'  DAY);
-- Additional cross-client ledger rows (richer Attack Point 2 injection grid)
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

-- ── 8d. Market Instruments (20 rows in luxury_items table) ───────────────────
-- Point 1 benign search (e.g. "ORCL") returns focused instrument rows.
-- Payload ' OR '1'='1 reveals ALL instrument categories that should not be
-- visible through a narrow user query.
-- Stocks
INSERT INTO luxury_items (name, price, category) VALUES ('Oracle Corp (ORCL)',               141.50,  'stock');
INSERT INTO luxury_items (name, price, category) VALUES ('Microsoft Corp (MSFT)',            415.20,  'stock');
INSERT INTO luxury_items (name, price, category) VALUES ('JPMorgan Chase (JPM)',             198.60,  'stock');
INSERT INTO luxury_items (name, price, category) VALUES ('NVIDIA Corp (NVDA)',               924.60,  'stock');
INSERT INTO luxury_items (name, price, category) VALUES ('Apple Inc (AAPL)',                 187.23,  'stock');
-- Bonds
INSERT INTO luxury_items (name, price, category) VALUES ('US Treasury Bond 10Y',             101.80,  'bond');
INSERT INTO luxury_items (name, price, category) VALUES ('US Treasury Bill 6M',               99.40,  'bond');
INSERT INTO luxury_items (name, price, category) VALUES ('Investment Grade Corp Bond A',     102.30,  'bond');
INSERT INTO luxury_items (name, price, category) VALUES ('High Yield Corp Bond B',            95.70,  'bond');
-- ETFs
INSERT INTO luxury_items (name, price, category) VALUES ('Vanguard S&P 500 ETF (VOO)',       490.00,  'etf');
INSERT INTO luxury_items (name, price, category) VALUES ('SPDR S&P 500 ETF (SPY)',           488.00,  'etf');
INSERT INTO luxury_items (name, price, category) VALUES ('Invesco QQQ Trust (QQQ)',          418.00,  'etf');
INSERT INTO luxury_items (name, price, category) VALUES ('Vanguard Total Market ETF (VTI)',  235.60,  'etf');
-- Crypto
INSERT INTO luxury_items (name, price, category) VALUES ('Bitcoin (BTC)',                   68450.00, 'crypto');
INSERT INTO luxury_items (name, price, category) VALUES ('Ethereum (ETH)',                   3620.00, 'crypto');
INSERT INTO luxury_items (name, price, category) VALUES ('Solana (SOL)',                      145.00, 'crypto');
-- Metals
INSERT INTO luxury_items (name, price, category) VALUES ('Gold Spot (XAU)',                  2280.00, 'metal');
INSERT INTO luxury_items (name, price, category) VALUES ('Silver Spot (XAG)',                  28.50, 'metal');
-- Other investment instruments
INSERT INTO luxury_items (name, price, category) VALUES ('20+ Year Treasury ETF (TLT)',       94.20,  'bond_etf');
INSERT INTO luxury_items (name, price, category) VALUES ('Corporate Bond ETF (LQD)',         109.30,  'bond_etf');

COMMIT;

-- 9. Initialize and Boot up Oracle SQL Firewall Kernel Within the PDB
-- Explicit package resolution ensures invocation succeeds even under non-SYS current schema
EXEC SYS.DBMS_SQL_FIREWALL.ENABLE;

-- 10. Establish Traffic Capture Framework for Machine Learning Training Phase
BEGIN 
    SYS.DBMS_SQL_FIREWALL.CREATE_CAPTURE('AEGIS_APP', TRUE, TRUE); 
    SYS.DBMS_SQL_FIREWALL.CREATE_CAPTURE('luminaforge', TRUE, TRUE); 
END;
/

PROMPT === [SUCCESS] Oracle 26ai PDB SQL Firewall Initialization Infrastructure Ready ===

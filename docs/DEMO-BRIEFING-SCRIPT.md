# Oracle SQL Firewall Demo — Presenter Script

**Audience:** Customer / partner briefing  
**Apps:** LuminaForge (attack surface) + Aegis Vault (SOC / Break-Glass)  
**Core product:** Oracle Database 26ai SQL Firewall  
**Optional extended act:** OCI WAF (scopes 4–6)

---

## How to use this script

| Mode | How |
|------|-----|
| **Full run** | Scopes **1 → 7** in order |
| **Core only** | Scopes **1 → 3** (SQL Firewall story; skip WAF) |
| **WAF differentiation only** | Scopes **4 → 7** (requires clean baseline — run Scope 3 or 7 first) |
| **Stop mid-demo** | End after any scope; run **Scope 3** or **Scope 7** before the next audience |

Each scope is self-contained: **Goal → URLs → Steps → Say → Expect → Exit criteria**.

---

## URL cheat sheet

**Current OCI deployment** (validated 2026-10-08 — all return HTTP 200; WAF blocks canonical SQLi with 403):

| Role | URL | When to use |
|------|-----|-------------|
| **Aegis Vault** | http://161.33.154.45:3000/ | Always — SOC + Break-Glass |
| **LuminaForge (direct, no WAF)** | http://161.33.154.45:3001/ | Scopes 1–3, 7 — **bypasses WAF** |
| **LuminaForge via OCI WAF** | http://151.145.73.122/ | Scopes 4–6 — LB `:80` → WAF → `:3001` |
| **Compute :80 shortcut** | `http://161.33.154.45/` | Optional redirect to WAF LB |

If IPs rotate after redeploy, refresh from Terraform compute outputs (`show_config.sh` on the VM, or `terraform output -raw aegis_vault_url` / `luminaforge_url` / `luminaforge_waf_url`).

**LuminaForge routes** (same paths on direct or WAF host):

| Screen | Path | Attack point |
|--------|------|--------------|
| Dashboard | `/` | — (benign) |
| Market | `/market` | Point 1 |
| Transactions | `/transactions` | Point 2 |
| Statement | `/statement` | Point 3 |
| Bulk | `/bulk` | Point 4 |

---

## Pre-flight (once per session)

1. Base DB lifecycle **AVAILABLE**; apps up:
   - Local: `./start.sh --check-db` then `./start.sh`
   - OCI: `systemctl is-active aegis-vault luminaforge`
2. Open Aegis `:3000` and LuminaForge `:3001` — both load without ORA errors.
3. Confirm baseline firewall posture (typical “Scope 1 ready” state):
   - LuminaForge **SQL Monitor ON**, **Block SQL OFF** (or as rehearsed)
   - Allow-list already generated (or run Scope 3 / 7 restore if unsure)
   - Violation logs empty (or acceptable for walk-through)
4. Browser windows: **Aegis Dashboard** + **LuminaForge** side by side.

---

# Scope 1 — Introduce the apps (no attacks, no data change)

**Goal:** Show what LuminaForge and Aegis Vault do in a normal, safe state.  
**Modify data?** No. **Attacks?** No. **WAF?** Not needed.

### Steps

| # | Action | Notes |
|---|--------|-------|
| 1.1 | Open **LuminaForge** direct URL `:3001` | Premium wealth / marketplace UI |
| 1.2 | Walk **Dashboard** | 3D globe, ticker — “user-facing fintech app” |
| 1.3 | Open **Market** | Search a **benign** ticker only, e.g. `ORCL`, `VOO`, or `BTC` |
| 1.4 | Open **Transactions** | Click **Show all my last 30 days records** (safe bind path) — only demo user’s rows |
| 1.5 | Mention **Statement** and **Bulk** tabs | “Later these are intentional SQLi points — not now” |
| 1.6 | Optional: open **Lumina AI** assistant | Safe MCP path — not vulnerable |
| 1.7 | Open **Aegis Vault** `:3000` → **Dashboard** | Shield globe, metrics, Latest Threats / Live Violations |
| 1.8 | Point to **Monitored Apps** / **Firewall Policy** | `luminaforge` SQL Monitor / Block status |
| 1.9 | Do **not** open Break-Glass yet | Save for Scope 3 |

### Say (30–60 sec)

> LuminaForge is a demo wealth app that talks to Oracle Database. Aegis Vault is the SOC console watching **Oracle SQL Firewall** for that same database user. Right now we only show normal usage — no injection, no policy changes.

### Expect

- Benign Market / Transactions results only for the demo user  
- Aegis may show **zero** new violations (or only old noise)  
- Shield stays calm (cyan) if logs are clean  

### Exit criteria

Audience understands both apps and that protection lives **in the database**, not in the UI.

**Stop here?** Fine. Continue → Scope 2.

---

# Scope 2 — Attack LuminaForge; monitor + block in Aegis Vault

**Goal:** Prove SQL injection reaches the DB on the **direct** URL, Aegis **monitors** it, and SQL Firewall can **block** it.  
**URL:** LuminaForge **`:3001` only** (no WAF).

### Prep in Aegis (Break-Glass)

| # | Action |
|---|--------|
| 2.0a | Sidebar → **Break-Glass Control** → login (any non-empty user/password in demo mode) |
| 2.0b | §3.1 → confirm **Enable SQL Monitoring** (if not already ON) |
| 2.0c | §3.1 → **Enable block SQL** (for the blocking act) |
| 2.0d | Optional: §3.3 **Clear violation logs** for a clean before/after |
| 2.0e | Return to **Dashboard** |

> If Block SQL is left **OFF**, you still get **monitor / log** violations — say “detect-only” and skip the “blocked in app” expectation.

### Attack ladder (pick 1–2 points for time; all four are valid)

#### Attack Point 1 — Market (`/market`)

| Step | Paste | Expect in LuminaForge |
|------|-------|------------------------|
| A | `' OR '1'='1` | All instruments returned |
| B (optional) | `' UNION SELECT ROWNUM, table_name, 0, 'SCHEMA' FROM user_tables --` | Table names |
| C (optional) | Column recon from UI hint / click step-2 row | Column schema |

#### Attack Point 2 — Transactions (`/transactions`) — **recommended headline**

| Step | Paste into ledger lookup | Expect |
|------|--------------------------|--------|
| A | `x' OR user_id<>1 --` | Cross-client rows (user_id 3, 4, 5, 8, 9) **if Block OFF** |
| | | **Error / no exfil** if Block ON |

#### Attack Point 3 — Statement (`/statement`)

| Paste | Expect (Block OFF) |
|-------|--------------------|
| `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` | Credential leak (seeded accounts) |

#### Attack Point 4 — Bulk (`/bulk`)

| Paste | Expect (Block OFF) |
|-------|--------------------|
| `; UPDATE users SET role='admin' WHERE id=1 --` | Navbar role escalates to admin |

### Monitor in Aegis (after each attack)

| # | Action | Expect |
|---|--------|--------|
| 2.1 | Watch **Dashboard** globe | Red flash → yellow “LuminaForge Attacked” / violation |
| 2.2 | **Latest Threats** / **Live Violations** | New row: Source **LuminaForge**, Type **SQL violation** |
| 2.3 | Click row → **Full SQL** | Injected statement visible |
| 2.4 | Metrics | Total / LuminaForge hits increase |

### Blocking effect

| Mode | App behaviour | Aegis |
|------|---------------|-------|
| **Block SQL ON** | Attack fails or returns error; exfil/escalation does not succeed | Violation still logged |
| **Block SQL OFF** | Attack succeeds in UI | Violation logged (detect-only) |

**Recommended narrative:** show one attack with Block **OFF** (damage visible) → Enable block → re-run same payload → blocked + still logged.

### Say

> The app is vulnerable by design. Perimeter tools are not in this path — traffic hits the database. SQL Firewall sees the **actual SQL**, not the HTTP string. Allow-list rejects unknown statements; with Block on, the database stops the attack.

### Exit criteria

At least one attack shown; Aegis shows violation + Full SQL; blocking story clear (ON and/or OFF).

**Stop here?** Run **Scope 3** before the next demo. Continue → Scope 3 (or skip to 4 only after reset).

---

# Scope 3 — Reset via Break-Glass (restore original demo status)

**Goal:** Wipe attack residue — transaction data, violation logs, and optionally re-baseline SQL Firewall capture/allow-list — so LuminaForge + Aegis match a clean **Scope 1** posture.

### Steps (Aegis → Break-Glass Control)

| # | Control (LuminaForge §3) | Purpose |
|---|--------------------------|---------|
| 3.1 | Login to **Break-Glass Control** | Required every visit |
| 3.2 | §3.1 **Disable block SQL** | Back to detect-friendly / Scope 1 default |
| 3.3 | §3.3 **Reinitialize default transaction data** | Restore seeded ledger (incl. cross-client rows; remove `BULK` noise) |
| 3.4 | §3.3 **Clear violation logs** | Empty Aegis Latest Threats / Live Violations; globe returns cyan |
| 3.5 | If Attack Point 4 ran: refresh LuminaForge | Navbar `role` back to non-admin (after reinit / session refresh) |

### Optional full policy rebuild (if allow-list polluted or capture state unclear)

| # | Action | Notes |
|---|--------|-------|
| 3.6 | §3.3 **Clear captured SQL rules** | Drops allow-list / capture — confirm dialog |
| 3.7 | §3.3 **Initialize default demo policy** | Requires LuminaForge **running**; starts capture + benign seed |
| 3.8 | Browse LuminaForge tabs (benign only) | Train session context |
| 3.9 | §3.3 **Stop SQL capture** | |
| 3.10 | §3.3 **Generate Allow List** | SQL Monitor ON, Block OFF |
| 3.11 | §3.1 confirm **Enable SQL Monitoring** | |

### Alternate / extra: SQL reset script

If Break-Glass reinit is unavailable:

```bash
# On DB as SYS or luminaforge — see repo
# luminaforge/scripts/reset-demo-data.sql
```

### Expect

- Transactions page: only normal demo-user ledger for benign query; Attack 2 seed rows restored for next run  
- Aegis: no (or cleared) violation rows; shield cyan  
- Policy: SQL Monitor ON, Block OFF (unless your standard baseline differs)  

### Exit criteria

Same as **Scope 1 ready**. Safe to stop or continue to WAF act.

**Stop here?** Yes — end of **core** demo. Continue → Scope 4 for WAF story.

---

# Scope 4 — Introduce OCI WAF (optional / extended)

**Goal:** Explain the **edge** layer without attacking yet. Position WAF as **complementary**, not a substitute for SQL Firewall.

### Steps

| # | Action |
|---|--------|
| 4.1 | Open **LuminaForge via WAF**: http://151.145.73.122/ (or compute `:80` redirect) |
| 4.2 | Contrast with direct `:3001` in a second tab | Same UI, different path |
| 4.3 | Draw the path on whiteboard / slide | Internet → **LB :80 + OCI WAF** → compute `:3001` → **Oracle DB + SQL Firewall** |
| 4.4 | Say what WAF sees | HTTP request text / mirrored query string |
| 4.5 | Say what WAF does **not** see | Decoded SQL inside the database kernel |

### Say

> OCI WAF is useful at the edge — it blocks many signature SQLi payloads before they reach the app. It is **optional** in this briefing. The unique Oracle story is SQL Firewall: allow-list of real SQL plus session context **inside** the database. Next we show WAF blocking; then a payload that slips past WAF but not SQL Firewall.

### Expect

- WAF URL loads LuminaForge (HTTP 200 on home)  
- No need to change Break-Glass yet  

### Exit criteria

Audience understands **two layers** and that WAF is the extended demo.

**Stop here?** OK. Continue → Scope 5.

---

# Scope 5 — Attack through WAF; OCI WAF blocks

**Goal:** Canonical SQLi is **stopped at the edge** (HTTP **403**). SQL may never reach the DB for that request.

**URL:** http://151.145.73.122/… only — **not** `:3001`.

### Prep

| # | Action |
|---|--------|
| 5.0 | Aegis: optional **Clear violation logs** so “no new SQL Firewall hit” is obvious |
| 5.0b | Keep Block SQL as you prefer (WAF should block first) |

### Attacks (canonical = WAF **403**)

| Tab | Path | Paste (from UI hint) | Expect |
|-----|------|----------------------|--------|
| Market | `/market` | `' OR '1'='1` | **403** + WAF block alert/JSON |
| Transactions | `/transactions` | `x' OR user_id<>1 --` | **403** |
| Statement | `/statement` | `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` | **403** |
| Bulk | `/bulk` | `; UPDATE users SET role='admin' WHERE id=1 --` | **403** |

**Pick Market and/or Transactions for a short demo.**

### Monitor

| # | Check | Expect |
|---|-------|--------|
| 5.1 | Browser / WAF response | HTTP **403** — attack does not return data |
| 5.2 | Aegis Latest Threats | **No new** SQL Firewall row for that blocked request (or no change) |

### Say

> WAF did its job — signature rules caught the obvious payload. Many teams stop here. But attackers obfuscate. Next we use a payload that **evades** these HTTP rules and still hits the database.

### Exit criteria

At least one clear **403** on the LB URL; contrast with “SQL Firewall did not need to fire.”

**Stop here?** Run Scope 3/7 before next audience. Continue → Scope 6.

---

# Scope 6 — Bypass OCI WAF; SQL Firewall catches (Aegis monitor + block)

**Goal:** Same UI route through WAF returns **200** with a bypass payload; **Oracle SQL Firewall** records (and can block) the statement; Aegis shows the SOC effect.

**URL:** still http://151.145.73.122/ for the attack; Aegis http://161.33.154.45:3000/ for monitoring.

### Prep in Aegis

| # | Action |
|---|--------|
| 6.0a | Break-Glass → **Enable SQL Monitoring** |
| 6.0b | Optional: **Enable block SQL** for blocking act |
| 6.0c | Optional: **Clear violation logs** |

### Bypass attacks (WAF **200**, DB sees real SQL)

| Tab | Paste (secondary UI hint) | Expect on LB |
|-----|---------------------------|--------------|
| **Market** `/market` | `'/**/OR/**/'1'='1` | **200** + all instruments (if Block OFF) |
| **Transactions** `/transactions` *(headline)* | Copy **hint line 2** — XML/hex `REGEXP_LIKE` / `DBMS_XMLGEN` / `HEXTORAW` payload | **200** + cross-client rows (if Block OFF) |

**Do not rely on Statement/Bulk for WAF bypass** — UI documents fallback: use `:3001` for those attacks; WAF blocks `UNION` / `UPDATE`.

### Headline three-beat (Transactions)

| Beat | Where | Payload | Result |
|------|-------|---------|--------|
| 1 | LB `/transactions` | `x' OR user_id<>1 --` | WAF **403** (recall Scope 5) |
| 2 | LB `/transactions` | XML/hex bypass (UI hint) | WAF **200**; exfil if Block OFF |
| 3 | Aegis Dashboard | — | **SQL violation** + Full SQL |

### Aegis monitor + block

| # | Action | Expect |
|---|--------|--------|
| 6.1 | Latest Threats / Live Violations | New **LuminaForge** SQL violation |
| 6.2 | Full SQL | Decoded / executed statement shape (not just the HTTP obfuscation story) |
| 6.3 | With **Block SQL ON**, re-paste bypass | App fails / no exfil; violation still logged |

### Say

> WAF only sees the HTTP string — hex and comment tricks hide keywords. The database executes the real SQL. SQL Firewall allow-lists **known-good** statements at the kernel. That is why it catches what the edge missed — with **zero app rewrite**.

### Exit criteria

Clear contrast: WAF allow → SQL Firewall detect/block → visible in Aegis.

**Stop here?** Must run **Scope 7** (or Scope 3) to restore.

---

# Scope 7 — Restore to original Scope 1 status

**Goal:** Same as Scope 3 — return to a clean, non-attacked demo baseline so the next run can start at Scope 1 (or stop cleanly).

### Steps (repeat Scope 3 checklist)

| # | Action |
|---|--------|
| 7.1 | Aegis → **Break-Glass Control** → login |
| 7.2 | §3.1 **Disable block SQL** |
| 7.3 | §3.3 **Reinitialize default transaction data** |
| 7.4 | §3.3 **Clear violation logs** |
| 7.5 | If needed: **Clear captured SQL rules** → **Initialize default demo policy** → benign browse → **Stop SQL capture** → **Generate Allow List** |
| 7.6 | Close WAF browser tab; leave bookmarks for `:3000` and `:3001` |
| 7.7 | Spot-check LuminaForge `:3001` Market/Transactions **benign** only — matches Scope 1 |

### Expect

- Aegis clean / cyan  
- LuminaForge data and role restored  
- SQL Monitor ON, Block OFF (standard)  
- Ready for Scope 1 again  

### Exit criteria

**Scope 1 ready.** Demo complete.

---

## Suggested run plans

| Audience time | Scopes | Story |
|---------------|--------|-------|
| **15–20 min** | 1 → 2 → 3 | Apps + SQL Firewall monitor/block + reset |
| **25–30 min** | 1 → 2 → 3 → 4 → 5 → 6 → 7 | Full differentiation (WAF vs SQL Firewall) |
| **WAF-only add-on** | 3 → 4 → 5 → 6 → 7 | After core demo already done |
| **Interrupted** | Stop any scope → **3 or 7** before next group | Never leave Block ON + dirty logs for the next presenter |

---

## Payload quick reference

| Point | Canonical (direct OK; WAF **403**) | WAF bypass (LB **200**) |
|-------|------------------------------------|-------------------------|
| 1 Market | `' OR '1'='1` | `'/**/OR/**/'1'='1` |
| 2 Transactions | `x' OR user_id<>1 --` | UI hint: `x'/**/OR/**/REGEXP_LIKE(...HEXTORAW...)...'` |
| 3 Statement | `0 UNION SELECT TO_CHAR(id), username, password, role FROM users` | None on LB — use `:3001` |
| 4 Bulk | `; UPDATE users SET role='admin' WHERE id=1 --` | None on LB — use `:3001` |

Constants live in `luminaforge/src/lib/waf-bypass-demo-payloads.ts` and on-screen demo hints.

---

## Break-Glass control map (Aegis)

| Section | Key buttons used in this script |
|---------|----------------------------------|
| **3.1 Firewall control** | Enable/Disable SQL Monitoring; Enable/Disable block SQL |
| **3.2 Firewall info** | View violations / capture / SQL Monitor status |
| **3.3 Firewall setup** | Reinitialize default transaction data; Initialize default demo policy; Start/Stop SQL capture; Generate Allow List; Clear violation logs; Clear captured SQL rules |

---

## Troubleshooting (live)

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| LB URL **502** | LuminaForge / backend down | Start apps; check LB health to private IP `:3001` |
| Init default policy fails | LuminaForge not reachable from Aegis | Ensure `:3001` up; `LUMINAFORGE_BASE_URL` |
| Context violations on tab switch | Allow-list trained without app | Re-run Initialize default demo policy with LuminaForge up |
| WAF bypass still **403** | Wrong URL (`:3001`) or wrong payload | Use LB URL; copy secondary hint exactly |
| Attack works on LB with canonical payload | WAF disabled / wrong host | Confirm `luminaforge_waf_url` |

---

## Related materials

| Doc | Purpose |
|-----|---------|
| `slides/demo-briefing-01-overview.pptx` | One-page problem / solution / advantage slide |
| `terraform/OCI-CONSOLE-QUICKSTART.md` §5B-waf | WAF vs SQL Firewall differentiation |
| `aegis-vault/SPEC-aegis.md` | Aegis SOC + Break-Glass |
| `luminaforge/SPEC-luminaforge.md` | Attack surface + WAF notes |
| `openspec/specs/waf-sql-firewall-differentiation-demo/spec.md` | Formal WAF differentiation requirements |

---

*End of presenter script — scopes 1–7.*

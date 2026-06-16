## Why

The demo now routes LuminaForge through **OCI WAF** (`sqlfw-demo-waf-policy`) and blocks the four canonical SQLi payloads at the HTTP edge (403). Presenters need a **second act** that shows WAF is not sufficient: an attacker can evade signature-based query-string rules using **XML + HEXTORAW obfuscation**, reach the same vulnerable `POST /api/transactions/filter` route, and still trigger **Oracle SQL Firewall** violations in Aegis Vault. Without this, audiences conflate WAF blocking with database-layer protection.

## What Changes

- Add a **documented, reproducible WAF-bypass payload** for Attack Point 2 (Transaction History ledger lookup) using the Oracle pattern:
  `x' OR REGEXP_LIKE(DBMS_XMLGEN.GETXMLTYPE(utl_raw.cast_to_varchar2(HEXTORAW('<hex>'))), …)`
  with sensitive SQL keywords encoded inside `<hex>` (not visible to OCI WAF query-string rules).
- Add a **presenter-only secondary demo hint** on `/transactions` (does **not** replace `x' OR user_id<>1 --`).
- Add **`waf-bypass-demo-payloads.ts`** (constants + hex helper comments) and **terraform / README presenter steps** for the three-way contrast: WAF block → WAF bypass → SQL Firewall alert.
- Verify **`luminaforge` DB privileges** for `DBMS_XMLGEN` / `UTL_RAW` (grant in setup SQL only if missing).
- **No change** to vulnerable SQL concatenation shapes, API contracts, `waf-query-mirror.ts`, canonical four payloads, or Aegis Vault code.

## Capabilities

### New Capabilities

- `waf-sql-firewall-differentiation-demo`: Presenter flow contrasting OCI WAF edge blocking, XML/hex HTTP evasion, and Oracle SQL Firewall detection on the same Attack Point 2 route.

### Modified Capabilities

- `luminaforge-attack-surface`: ADD optional Attack Point 2 scenario for XML/hex WAF-bypass payload; canonical `x' OR user_id<>1 --` behavior unchanged.

## Impact

- **LuminaForge UI**: secondary hint on Transaction History lookup only (`TransactionHistoryLookup.tsx`).
- **LuminaForge lib**: new `waf-bypass-demo-payloads.ts` (constants; no runtime logic change to queries).
- **Docs**: `luminaforge/README.md`, `luminaforge/SPEC-luminaforge.md`, `terraform/OCI-CONSOLE-QUICKSTART.md` (presenter script).
- **Oracle setup** (conditional): `Oracle_DB_Setup.sql` grants if `DBMS_XMLGEN` / `UTL_RAW` not already executable by `luminaforge`.
- **OCI WAF**: no policy change required — bypass demonstrates limitation of current JMESPath rules.
- **Aegis Vault**: no code change; receives new violations when bypass payload runs.

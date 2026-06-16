## Context

**Shipped (Attack Point 2):** `waf-bypass-demo-payloads.ts` exports `ATTACK2_WAF_BYPASS_XML_HEX` using `/**/OR/**/` comment obfuscation plus `REGEXP_LIKE` / `DBMS_XMLGEN` / `HEXTORAW`. Secondary hint in `TransactionHistoryLookup.tsx`. Validated on OCI WAF (`168.110.61.146`).

**OCI WAF rules** (`terraform/waf-request-access-control-sqli.json`) block substrings in mirrored query strings:

| Rule | Triggers |
|------|----------|
| `block-sqli-attack-1-2-auth-bypass` | `%27+OR+`, `%27%20OR%20` |
| `block-sqli-attack-1-3-union-recon` | `UNION`, `user_tables`, `user_tab_columns` |
| `block-sqli-attack-2-exfiltration` | `user_id` |
| `block-sqli-attack-4-stacked` | `UPDATE`, `; UPDATE` variants |

**Live spike results (June 2026):**

| Attack | Canonical | Bypass technique tested | WAF | SQL outcome |
|--------|-----------|-------------------------|-----|-------------|
| 1 step 1 | `' OR '1'='1` | `'/**/OR/**/'1'='1` | **200** | All `luxury_items` |
| 1 step 1 | — | `REGEXP_LIKE` / `HEXTORAW` (same hex as AP2) | **200** | All `luxury_items` |
| 1 steps 2–3 | UNION recon | `/**/UNION/**/` | **403** | — |
| 2 | `x' OR user_id<>1 --` | `/**/OR/**/REGEXP_LIKE…` | **200** | Cross-user rows |
| 3 | `0 UNION SELECT …` | `/**/UNION/**/`, `UN'||'ION`, CHR build | **403** or SQL error | No credential leak |
| 4 | `; UPDATE users …` | `UP'||'DATE`, `EXECUTE IMMEDIATE` | **200** (no UPDATE substring) | ORA-00900 / split breaks PL/SQL |

**Injection contexts** (unchanged — `vulnerable-queries.ts`):

| Point | Field | SQL shell |
|-------|-------|-----------|
| 1 | `q` | `WHERE name LIKE '%${q}%'` |
| 2 | `ref` | `WHERE user_id = 1 AND type = '${ref}'` |
| 3 | `taxId` | `WHERE user_id = ${taxId}` (numeric, no quotes) |
| 4 | `note` | `INSERT … -- memo: ${note}` or `INSERT; ${note}` split on `;` |

## Goals / Non-Goals

**Goals:**

- Every attack screen shows a **secondary WAF-bypass hint** pasteable from the UI on the LB URL, using the same presenter pattern as Attack Point 2.
- **Tier A (must ship):** Attack Point 1 step 1 — boolean bypass via `/**/OR/**/` and/or `REGEXP_LIKE` / `HEXTORAW` (both proven on WAF).
- **Tier B (engineer during apply):** Attack Points 3 and 4 — find payloads that achieve the **same demo outcome** as canonical attacks without blocked substrings in the mirrored query.
- Canonical primary hints unchanged; `:3001` regression unchanged.
- Constants centralized in `waf-bypass-demo-payloads.ts`; UI imports hints only.

**Non-Goals:**

- Changing `vulnerable-queries.ts`, API routes, or `waf-query-mirror.ts`.
- Weakening OCI WAF policy JSON.
- WAF bypass for Market Explorer steps 2–3 (UNION recon) unless a hex-only breakthrough is discovered (unlikely — `UNION` substring rule).
- Replacing Attack Point 2 implementation (already shipped).

## Decisions

### Decision 1 — Reuse `waf-bypass-demo-payloads.ts` for all constants

Add `ATTACK1_WAF_BYPASS_*`, `ATTACK3_WAF_BYPASS_*`, `ATTACK4_WAF_BYPASS_*` alongside existing `ATTACK2_*`. Each export includes a one-line comment describing WAF vs direct behaviour and hex decode where applicable.

**Rationale:** Single discoverable module; matches Attack Point 2 pattern.

### Decision 2 — Attack 1: ship two equivalent secondary hints (comment OR + XML/hex)

- **Primary (unchanged):** `Step 1 · Boolean bypass → ' OR '1'='1`
- **Secondary line A:** `'/**/OR/**/'1'='1` (comment obfuscation — copy-safe)
- **Secondary line B (optional single line):** `REGEXP_LIKE` / `HEXTORAW` variant in LIKE context (visual parity with Attack 2)

Prefer **one** secondary line in UI to avoid clutter — use `/**/OR/**/` as default; include REGEXP_LIKE variant in constants/docs for presenters who want the XML/hex story on Market.

**Alternative considered:** Only REGEXP_LIKE on Market — rejected; `/**/OR/**/` is simpler and copy-safe.

### Decision 3 — Attack 3 & 4: payload engineering gate before UI merge

Implementation MUST NOT add hint text until live WAF test passes:

1. Mirrored query on `168.110.61.146` → **200**
2. Same outcome class as canonical (credentials for AP3; role escalation for AP4)
3. No blocked substring in mirrored query (`UNION`, `UPDATE`, `user_id`, `' OR `)

**Candidate strategies (ordered):**

| Point | Strategy |
|-------|----------|
| 3 | Hex-only `HEXTORAW` blob containing `UNION SELECT …` with outer shell free of `UNION`; numeric wrapper expressions (`0 OR …`) that still produce credential rows — **high risk** due to numeric context |
| 4 | Second split statement built from `EXECUTE IMMEDIATE` + `CHR()` / `'UP'||'DATE'` with **no** contiguous `UPDATE` in URL; avoid `;` splitting PL/SQL blocks |

**Fallback if Tier B fails:** Secondary hint on Statement/Bulk states *"Canonical payload blocked on WAF URL — use `:3001` for full attack"* and links to quickstart. Proposal still delivers Tier A for Market + existing Transaction hint.

### Decision 4 — UI pattern matches Transaction History

Each screen appends one `font-mono text-[10px]` line below existing hints:

- `market/page.tsx` — after step 1/2/3 hints
- `statement/page.tsx` — after `DEMO_HINT`
- `BulkActionPanel.tsx` — after `DEMO_HINT`

No copy-to-clipboard button in v1 (paste from hint text).

### Decision 5 — Documentation parity

Extend `OCI-CONSOLE-QUICKSTART.md` differentiation table to all four tabs (or note Tier B fallback). Update `luminaforge/README.md` demo payload table rows 1b, 3b, 4b.

## Risks / Trade-offs

- **[Risk] Attack 3/4 bypass not achievable without code changes** → Mitigate with Tier A delivery + honest fallback hints; do not weaken WAF rules.
- **[Risk] Long payloads wrap/truncate in UI** → Use `break-all` on hint paragraphs (already on Transaction History).
- **[Risk] Copy-paste normalizes characters** → Avoid tab-encoded OR; prefer `/**/OR/**/` and hex-only keyword hiding.
- **[Trade-off] Market steps 2–3 stay WAF-blocked** → Presenter uses `:3001` for UNION recon; differentiation demo focuses on boolean/exfil/destructive tiers.

## Migration Plan

1. Engineer Tier B payloads on live PDB + WAF (implementation tasks 1.x).
2. Add constants + UI hints + docs.
3. `npm run build` in `luminaforge`.
4. Commit, push, rebuild on compute VM (`git pull`, `npm run build`, `systemctl restart luminaforge`).
5. Presenter rehearsal per tab on LB URL.

## Open Questions

1. **Attack 3:** Can numeric `taxId` injection append a `UNION` arm without the literal `UNION` appearing in the mirrored query string?
2. **Attack 4:** Can `executeBulkAction` split model run a one-statement dynamic SQL escalation without `UPDATE` in the URL and without PL/SQL block semicolons?
3. **Market UI:** One or two secondary lines for step 1 (comment OR only vs comment + REGEXP_LIKE)?

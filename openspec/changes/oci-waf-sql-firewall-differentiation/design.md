## Context

**Current state (post `594aead`):**

| Layer | Mechanism | Attack Point 2 canonical payload |
|-------|-----------|--------------------------------|
| OCI WAF | JMESPath on mirrored query string (`waf-query-mirror.ts`) | `x' OR user_id<>1 --` → **403** |
| LuminaForge | Raw concat in `filterTransactions(ref)` | `WHERE user_id = 1 AND type = '${ref}'` |
| Oracle SQL Firewall | Kernel allow-list / violations | Logs anomalous SQL for `luminaforge` |
| Direct bypass | `:3001` (no WAF) | Same payload → exfil + Firewall violation |

OCI WAF rules flag literal substrings: `UNION`, `user_id`, `UPDATE`, `%27+OR+`, `%27%20OR%20`. Request Protection body rules are configured but do not reliably block JSON POST bodies.

**User-supplied technique (classic Oracle obfuscation):**

```sql
x' OR REGEXP_LIKE(
  DBMS_XMLGEN.GETXMLTYPE(
    utl_raw.cast_to_varchar2(
      HEXTORAW('<hex-encoded payload>')
    )
  ),
  '<pattern>'
) --
```

Sample hex `73656c6563742027524553272066726f6d206475616c` decodes to `select 'RES' from dual` (proof placeholder). Production demo hex must encode XML/SQL that achieves **cross-user ledger exfiltration** while keeping `user_id`, `UNION`, and plain `' OR '` out of the HTTP-visible string (except inside the hex digest).

**Why Attack Point 2:** The `x'` prefix matches `type = '…'` string breakout. Points 1/3/4 rely on keywords (`UNION`, `UPDATE`) that WAF blocks even with obfuscation in the outer shell; Point 2 is the best fit for XML/hex differentiation without altering other attack ladders.

## Goals / Non-Goals

**Goals:**

- One **text-box pasteable** Attack Point 2 payload that:
  1. Returns **403** on WAF path when canonical `x' OR user_id<>1 --` is used (unchanged).
  2. Returns **200** with cross-user rows on WAF path when XML/hex payload is used.
  3. Produces **SQL Firewall violations** in Aegis (database layer still sees decoded SQL).
- Presenter script: **WAF blocked → WAF bypassed → SQL Firewall caught**.
- Zero regression on Attacks 1, 3, 4, benign flows, `:3001` direct path, and AI safe route.

**Non-Goals:**

- Changing `vulnerable-queries.ts` concat templates or adding server-side payload decoding.
- New API routes or XML `Content-Type` parsing in Next.js.
- Weakening OCI WAF policy to make bypass easier.
- XML/hex bypass payloads for all four attack points (only Point 2 in scope).
- Replacing tab-whitespace bypass documentation (orthogonal; may reference in presenter notes).

## Decisions

### Decision 1 — Attack Point 2 only; additive presenter hint

Add a **second monospace hint** below the existing `DEMO_HINT` in `TransactionHistoryLookup.tsx`:

- Line 1 (unchanged): `x' OR user_id<>1 --` (WAF-blocked on `168.110.61.146`, works on `:3001`).
- Line 2 (new): complete XML/hex `REGEXP_LIKE` / `HEXTORAW` payload (WAF-bypass on LB URL).

Rationale: satisfies “do not change other behaviour” — canonical payloads and UI flows stay intact.

### Decision 2 — Payload constants in `waf-bypass-demo-payloads.ts`

Centralize the finalized payload string, hex blob, and a one-line comment decoding hex → plaintext for presenters. **No import from vulnerable-queries** — UI imports hint text only.

Rationale: keeps attack surface documentation discoverable without touching SQL execution path.

### Decision 3 — Engineer complete closing syntax during implementation

User fragment ends with `,]` and omits `REGEXP_LIKE` pattern + comment terminator. Implementation task must:

1. Close: `,'^.*') --` (or equivalent pattern that evaluates true for demo).
2. Replace placeholder hex with XML wrapping SQL that breaks out of `type = '…'` and applies `user_id <> 1` **inside decoded content** or via boolean true from `REGEXP_LIKE`.
3. Validate on OCI Base DB 26ai with `luminaforge` user (SQL\*Plus or `curl` against live demo).

**Alternative considered:** JSON body-only bypass without XML (already works via curl, no `user_id` in query). Rejected as primary because user explicitly requested XML/hex classic technique.

### Decision 4 — Keep `wafMirrorUrl` unchanged

Bypass must work **through the same mirror** presenters use in the UI (proves WAF rule gap, not “disable mirror”). Hex encoding hides `user_id` / `UNION` from JMESPath; outer ` OR ` may still need tab encoding (`\tOR\t`) if `%27+OR+` rule fires — validate during implementation and document final string.

### Decision 5 — DB privileges check before grants

`DBMS_XMLGEN` and `UTL_RAW` are often available to `RESOURCE` users; implementation verifies with:

```sql
SELECT * FROM session_privs WHERE privilege LIKE '%XML%' OR privilege LIKE '%EXECUTE%';
```

Add explicit `GRANT EXECUTE ON DBMS_XMLGEN TO luminaforge` (and `UTL_RAW` if needed) to `Oracle_DB_Setup.sql` **only** if live test fails.

### Decision 6 — Documentation-only WAF section extension

Extend `terraform/OCI-CONSOLE-QUICKSTART.md` §5B-waf with **Differentiation demo** (3-step presenter table). No Terraform/WAF JSON changes unless testing shows policy must allow benign `REGEXP_LIKE` (unlikely).

## Pre-implementation analysis (what must change)

| Area | Change needed? | Notes |
|------|----------------|-------|
| `vulnerable-queries.ts` | **No** | Same concat; payload is valid Oracle SQL when injected |
| API routes | **No** | Still `POST` JSON `{ ref }` |
| `waf-query-mirror.ts` | **No** | Mirror stays; bypass relies on encoded payload |
| `TransactionHistoryLookup.tsx` | **Yes** | Add secondary hint importing constant |
| `waf-bypass-demo-payloads.ts` | **Yes** | New file |
| `luminaforge/README.md` | **Yes** | WAF vs SQL Firewall subsection |
| `SPEC-luminaforge.md` | **Yes** | Short § on differentiation demo |
| `OCI-CONSOLE-QUICKSTART.md` | **Yes** | Presenter script |
| `Oracle_DB_Setup.sql` | **Maybe** | Grants only if privileges missing |
| OCI WAF policy JSON | **No** | Intentionally demonstrates gap |
| Aegis Vault | **No** | Existing poller |

## Risks / Trade-offs

- **[Risk] Payload incomplete / syntactically invalid** → Implementation must test on live PDB before merging hint text.
- **[Risk] `luminaforge` lacks package execute** → Mitigate with conditional grants + note in quickstart.
- **[Risk] SQL Firewall allow-list permits obfuscated SQL after training** → Presenter runs bypass **before** allow-list hardening, or with capture on; document in demo script.
- **[Risk] Outer ` OR ` still triggers WAF** → Use tab-encoded OR or `||` rewrite in finalized constant; verify HTTP 200 on LB URL.
- **[Trade-off] Single attack point** → Full four-point XML bypass out of scope; tab bypass already covers Points 1–2 partially.

## Migration Plan

1. Engineer + validate payload on demo PDB (SQL Developer or compute VM).
2. Add constants + UI hint + docs (no app logic change).
3. Optional: re-run `Oracle_DB_Setup.sql` grants section if added.
4. Rebuild LuminaForge on compute VM; no WAF policy update.
5. Presenter rehearsal: LB URL block (canonical) → LB URL bypass (XML/hex) → Aegis violation row.

## Open Questions

1. **Final `REGEXP_LIKE` pattern** — confirm minimal pattern (`'^.'`, `'.*'`, etc.) that returns true without false negatives on demo data.
2. **Exact hex content** — whether to embed `user_id<>1` inside XML text vs. rely on `OR REGEXP_LIKE(…)` boolean alone for row expansion (must match seeded exfil expectation: user_ids 3,4,5,8,9).
3. **SQL Firewall enforcement mode** — demo script should state whether bypass is **logged only** or **blocked** depending on Demo Control allow-list state.

## Why

Attack Point 2 (Transaction History) now documents a WAF-evasion payload (`/**/OR/**/` and `REGEXP_LIKE` / `HEXTORAW`) that works when pasted from the UI on the OCI load-balancer path. The other three LuminaForge attack text boxes still show only canonical payloads that return **403** on the WAF URL, which breaks the three-layer presenter story (WAF block → WAF bypass → SQL Firewall) on Market, Statement, and Bulk screens.

Presenters need the same **secondary monospace hint** pattern on every attack input so each tab demonstrates edge bypass without leaving the LB URL.

## What Changes

- Extend `luminaforge/src/lib/waf-bypass-demo-payloads.ts` with finalized bypass constants for Attack Points **1, 3, and 4** (Attack 2 already shipped).
- Add a **secondary WAF-bypass hint line** below existing demo hints on:
  - Market Explorer (`/market`) — Attack Point 1 step 1 minimum
  - Custom Statement (`/statement`) — Attack Point 3
  - Bulk Action (`/bulk`) — Attack Point 4
- Keep canonical hint lines and `:3001` behaviour unchanged; no changes to `vulnerable-queries.ts`, API routes, or `waf-query-mirror.ts`.
- Payload engineering SHALL validate each constant on live OCI WAF (`168.110.61.146`) with mirrored query strings before hint text is merged.
- Update presenter docs (`terraform/OCI-CONSOLE-QUICKSTART.md`, `luminaforge/README.md`, `SPEC-luminaforge.md`) with per-screen bypass rows and expected outcomes.
- **Out of scope for v1:** Market Explorer steps 2–3 (UNION / `user_tables` / `user_tab_columns`) remain WAF-blocked on the LB path unless a hex-only payload is proven during implementation; document honestly if not feasible.

## Capabilities

### New Capabilities

- `luminaforge-waf-bypass-hints`: Secondary UI hints and shared constants that let presenters paste WAF-evasion payloads from each attack text box on the OCI LB URL.

### Modified Capabilities

- `luminaforge-attack-surface`: Document optional WAF-bypass payloads and expected WAF vs direct behaviour for Attack Points 1, 3, and 4 (Attack 2 already documented in app spec).

## Impact

- **Code:** `waf-bypass-demo-payloads.ts`, `market/page.tsx`, `statement/page.tsx`, `BulkActionPanel.tsx`
- **Docs:** `luminaforge/README.md`, `SPEC-luminaforge.md`, `terraform/OCI-CONSOLE-QUICKSTART.md`
- **No change:** OCI WAF policy JSON, Terraform, Aegis Vault, `vulnerable-queries.ts`, Oracle setup (unless privilege errors appear during payload spikes)
- **Deploy:** Rebuild LuminaForge on compute VM after merge

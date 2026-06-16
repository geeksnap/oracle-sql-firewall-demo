# Tasks: WAF bypass hints on all attack text boxes

## 1. Payload engineering — Tier A (Attack Point 1, proven)

- [x] 1.1 Add `ATTACK1_WAF_BYPASS_BOOLEAN` (`'/**/OR/**/'1'='1`) to `waf-bypass-demo-payloads.ts` with WAF rule comment
- [x] 1.2 Add `ATTACK1_WAF_BYPASS_XML_HEX` (`REGEXP_LIKE` / `HEXTORAW` in LIKE context) with hex decode comment
- [x] 1.3 Live test on OCI: canonical `' OR '1'='1` → **403**; both Tier A payloads → **200** + all `luxury_items` on LB URL with mirrored `q`

## 2. Payload engineering — Tier B (Attack Points 3 & 4, spike)

- [x] 2.1 Spike Attack Point 3: engineer `taxId` payload without `UNION`/`user_id` in mirrored query that returns user credentials on LB URL
- [x] 2.2 Spike Attack Point 4: engineer `note` payload without `UPDATE` in mirrored query that escalates `role=admin` on LB URL (respect `splitStatements` model)
- [x] 2.3 If 2.1 succeeds: add `ATTACK3_WAF_BYPASS_*` constant + validation notes; if not: define `ATTACK3_WAF_BYPASS_FALLBACK` copy for UI
- [x] 2.4 If 2.2 succeeds: add `ATTACK4_WAF_BYPASS_*` constant + validation notes; if not: define `ATTACK4_WAF_BYPASS_FALLBACK` copy for UI

## 3. UI secondary hints (no query logic change)

- [x] 3.1 Update `market/page.tsx`: append secondary WAF-bypass hint line (import from `waf-bypass-demo-payloads.ts`); keep step 1/2/3 canonical hints
- [x] 3.2 Update `statement/page.tsx`: append secondary hint (bypass constant or Tier B fallback)
- [x] 3.3 Update `BulkActionPanel.tsx`: append secondary hint (bypass constant or Tier B fallback)
- [x] 3.4 Confirm `TransactionHistoryLookup.tsx` unchanged (Attack 2 already shipped)

## 4. Documentation

- [x] 4.1 Extend `terraform/OCI-CONSOLE-QUICKSTART.md` differentiation section with per-tab bypass table (note Market step 2–3 WAF-blocked)
- [x] 4.2 Update `luminaforge/README.md` demo payload rows 1b, 3b, 4b
- [x] 4.3 Update `luminaforge/SPEC-luminaforge.md` §5 bullets for WAF bypass on all four points

## 5. Verification & deploy

- [x] 5.1 `npm run build` in `luminaforge` passes
- [x] 5.2 Manual rehearsal on OCI LB URL: each tab — canonical **403** (where applicable) → bypass **200** (or document fallback)
- [x] 5.3 `:3001` regression: all four canonical payloads still work
- [ ] 5.4 Deploy to compute VM: `git pull`, `npm run build`, `systemctl restart luminaforge`

## 6. Human review (OpenSpec gate)

- [ ] 6.1 Reviewer approves proposal, design, and spec deltas before `/opsx:apply` merge

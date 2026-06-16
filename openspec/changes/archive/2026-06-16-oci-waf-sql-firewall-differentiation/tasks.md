# Tasks: OCI WAF vs SQL Firewall differentiation demo

## 1. Payload engineering (blocking)

- [x] 1.1 Complete the user-supplied fragment into valid Oracle SQL (close `REGEXP_LIKE`, add `--` terminator, remove stray `[` if not intentional)
- [x] 1.2 Replace placeholder hex `73656c6563742027524553272066726f6d206475616c` with hex encoding XML/SQL that achieves cross-user exfil on `filterTransactions` (`user_id` 3,4,5,8,9 visible)
- [x] 1.3 Test on demo PDB as `luminaforge`: SQL executes without ORA privilege errors
- [x] 1.4 Test via WAF URL with mirrored query: canonical `x' OR user_id<>1 --` → **403**; XML/hex payload → **200** + cross-user rows
- [x] 1.5 If `DBMS_XMLGEN` / `UTL_RAW` fail, add minimal `GRANT EXECUTE` to `Oracle_DB_Setup.sql` and note re-run in quickstart

## 2. LuminaForge constants + UI (no query logic change)

- [x] 2.1 Create `luminaforge/src/lib/waf-bypass-demo-payloads.ts` with finalized `ATTACK2_WAF_BYPASS_XML_HEX` constant and hex decode comment
- [x] 2.2 Update `TransactionHistoryLookup.tsx`: append secondary hint line (import constant); keep existing `DEMO_HINT` and fetch/`wafMirrorUrl` behaviour unchanged
- [x] 2.3 Confirm Attacks 1, 3, 4 components untouched

## 3. Documentation

- [x] 3.1 Add **WAF vs SQL Firewall differentiation** subsection to `terraform/OCI-CONSOLE-QUICKSTART.md` (block → bypass → Aegis; curl optional)
- [x] 3.2 Update `luminaforge/README.md` with secondary payload row for Attack 2 only
- [x] 3.3 Update `luminaforge/SPEC-luminaforge.md` §5 with one bullet on differentiation demo (Attack 2 XML/hex)

## 4. Verification

- [x] 4.1 `npm run build` in `luminaforge` passes
- [x] 4.2 Manual presenter rehearsal on OCI: WAF block (canonical) → WAF bypass (XML/hex) → Aegis violation
- [x] 4.3 Confirm `:3001` canonical payloads for all four attack points still work (regression)

## 5. Human review (OpenSpec gate)

- [ ] 5.1 Reviewer approves `proposal.md`, `design.md`, and spec deltas before `/opsx:apply` implementation merge

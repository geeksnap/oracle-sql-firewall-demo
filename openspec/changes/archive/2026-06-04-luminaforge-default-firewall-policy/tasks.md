## 1. Allow-list asset and documentation

- [x] 1.1 Document export steps in `#Document/Demo_Control_Setup.md` (benign SQL → export JSON)
- [x] 1.2 Add `sql/luminaforge_default_allowlist.json` (or SQL CLOB install fragment) to the repo

## 2. Database package (v2.8.0)

- [x] 2.1 Implement `init_default_demo_policy` — clear existing policy, `IMPORT_ALLOW_LIST`, `ENABLE_ALLOW_LIST` (block FALSE), no capture start
- [x] 2.2 Bump package to 2.8.0 and `aegis-vault/build-info.json`

## 3. Demo Control API and UI

- [x] 3.1 Add `init-default-policy` to types, luminaforge scope, confirm dialog in `DemoControlPanel.tsx`
- [x] 3.2 Add **Initialize default demo policy** button at top of §3.3 in `LuminaforgeFirewallControlCenter.tsx`

## 4. Verification

- [x] 4.1 `npm run build` passes
- [ ] 4.2 Manual: init default → ENFORCED · LOG; benign SELECT OK; attack SQL logs violation; capture OFF

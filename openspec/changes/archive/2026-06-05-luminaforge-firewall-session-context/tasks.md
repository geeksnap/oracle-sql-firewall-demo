## 1. Bootstrap SQL — session lookup shape

- [x] 1.1 Add `SELECT username, role FROM users WHERE id = 1` (or equivalent) to `sql/luminaforge_bootstrap_benign.sql` procedure
- [x] 1.2 Add same query to inline fallback array in `aegis-vault/lib/db/luminaforge-session.ts`

## 2. Init-default-policy — LuminaForge HTTP training

- [x] 2.1 Add `LUMINAFORGE_BASE_URL` (default `http://localhost:3001`) to Aegis env example and read in demo-control
- [x] 2.2 In `executeInitDefaultPolicy`, after capture start + PL/SQL bootstrap, `fetch` `/api/session` and `/api/portfolio` on LuminaForge before finalize
- [x] 2.3 On HTTP failure (ECONNREFUSED, timeout), return `ok: false` with message: start LuminaForge first, then re-run init
- [x] 2.4 Include HTTP training summary line in Demo Control output (e.g. "LuminaForge app context captured via /api/session")

## 3. Documentation and verification

- [x] 3.1 Update `luminaforge/SPEC-luminaforge.md` — Context violation vs SQL violation; init requires LuminaForge running
- [ ] 3.2 Manual: init default policy with LuminaForge up → switch tabs 3× → no new Context violation rows in Aegis
- [x] 3.3 `npm run build` in `aegis-vault` passes

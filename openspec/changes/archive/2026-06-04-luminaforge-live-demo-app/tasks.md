## 0. Schema re-deploy (prerequisite)

- [x] 0.1 Re-run `Oracle_DB_Cleanup.sql` then `Oracle_DB_Setup.sql` as SYS in PDB `AHDB2605_PDB1` to apply the `users.password` column and seeded `admin` row
- [x] 0.2 Confirm `SELECT username, password, role FROM luminaforge.users` returns 2 rows (`demo_user` + `admin`)

## 1. App scaffold & DB layer

- [x] 1.1 Scaffold Next.js 15 App Router project under `./luminaforge` (TypeScript, Tailwind, react 19)
- [x] 1.2 Add dependencies: `next@^15`, `react@19`, `oracledb`, `dotenv`, three/react-three-fiber, framer-motion
- [x] 1.3 Create `.env` + `.env.example` (`DB_USER=luminaforge`, `DB_PASSWORD`, `DB_CONNECTION_STRING`, `DB_CONTAINER=AHDB2605_PDB1`, `PORT=3001`)
- [x] 1.4 Implement `src/lib/db/pool.ts` (oracledb Thin pool, `withConnection` + `finally` close)
- [x] 1.5 Implement `server.ts` custom server on port 3001 guarding `DB_USER=luminaforge`
- [x] 1.6 Add `README.md` with prominent "intentionally vulnerable — demo only" banner

## 2. Dark Luxury UI shell

- [x] 2.1 Build `theme.ts` tokens (#0f172a navy, #f4c95d gold, neon cyan) + Tailwind config
- [x] 2.2 Build `layout.tsx` shell with top nav hosting the Universal Search Bar
- [x] 2.3 Build Dashboard `page.tsx` with `PortfolioGlobe` (3D) + `PriceTicker` + glass cards
- [x] 2.4 Build `LuminaAssistant.tsx` floating widget (calls safe `/api/ai-query`)

## 3. Attack Point 1 — Market Explorer search (boolean bypass)

- [x] 3.1 Build `market/page.tsx` + `UniversalSearchBar.tsx` (camouflaged as ticker search)
- [x] 3.2 Implement VULNERABLE `api/market/search/route.ts` — raw concat `LIKE '%${q}%'` on `luxury_items`, no binds
- [ ] 3.3 Verify `' OR '1'='1` returns all items and a row appears in `DBA_SQL_FIREWALL_VIOLATIONS`

## 4. Attack Point 2 — Transaction History filter (conditional exfiltration)

- [x] 4.1 Build `transactions/page.tsx` + `AdvancedSearchDrawer.tsx` ("Memo / Reference ID Filter")
- [x] 4.2 Implement VULNERABLE `api/transactions/filter/route.ts` — raw concat into `user_id=1 AND type='${ref}'`, no binds
- [ ] 4.3 Verify `x' OR user_id<>1 --` leaks other users' transactions and logs a violation

## 5. Attack Point 3 — Custom Statement generator (UNION leak)

- [x] 5.1 Build `statement/page.tsx` ("Tax Institution ID" field) + `StatementGrid.tsx`
- [x] 5.2 Lock base SELECT column count/types against live `DESCRIBE` for UNION compatibility with `users` (TO_CHAR approach — all VARCHAR2, 4 cols)
- [x] 5.3 Implement VULNERABLE `api/statement/generate/route.ts` — raw concat into numeric predicate, no binds
- [ ] 5.4 Verify `0 UNION SELECT id, username, password, role FROM users` renders credentials into the grid and logs a violation

## 6. Attack Point 4 — Quick Bulk Action memo (stacked query)

- [x] 6.1 Build `bulk/page.tsx` + `BulkActionPanel.tsx` ("Batch Execution Note" textarea)
- [x] 6.2 Implement VULNERABLE `api/bulk/execute/route.ts` — concat note, split on `;`, execute stacked statements, no binds
- [ ] 6.3 Verify `ok'; UPDATE users SET role='admin' WHERE id=1 --` runs the second command while UI shows success; logs violation(s)
- [x] 6.4 Write `scripts/reset-demo-data.sql` to restore seeded baseline after the destructive demo

## 7. Safe path & ground-truth checks

- [x] 7.1 Implement SAFE `api/ai-query/route.ts` (stub — MCP wiring deferred per config)
- [x] 7.2 Implement SAFE `api/portfolio/route.ts` parameterized reads (binds) as a contrast example
- [x] 7.3 Confirm every route references only verified tables/columns; no `Oracle_DB_Setup.sql` change

## 8. End-to-end demo verification

- [ ] 8.1 Run LuminaForge (3001) + Aegis Vault (3000) together; confirm no port collision  ← live DB required
- [ ] 8.2 Trigger each of the 4 attacks; confirm Aegis Threat Feed shows Source App = luminaforge + globe alert within one poll cycle  ← live DB required
- [ ] 8.3 Toggle Firewall allow-list/block from Aegis Demo Control; confirm log-only vs ORA-47605 blocked branches  ← live DB required
- [ ] 8.4 Run reset script; confirm repeatable demo state  ← live DB required

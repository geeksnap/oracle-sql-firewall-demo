## 1. ViolationsTable compact variant

- [x] 1.1 Add `variant?: "full" | "compact"` to `ViolationsTableProps` (default `"full"`)
- [x] 1.2 When `variant="compact"`, render only Time, Source App, Type (headers + cells)
- [x] 1.3 Remove `min-w-[600px]` for compact; use `w-full` and truncate Type if needed
- [x] 1.4 Keep `full` variant behavior identical to today (User, Action, SQL, optional flags)

## 2. Wire right rail

- [x] 2.1 Pass `variant="compact"` on right-aside `ViolationsTable` with `title="Live Violations"` in `page.tsx`

## 3. Verification

- [x] 3.1 Visual check: right rail shows 3 columns only at lg breakpoint
- [x] 3.2 Visual check: Threat Feed and Violations nav still show full columns
- [x] 3.3 Optional: note in `SPEC-aegis.md` that Live Violations right rail is compact

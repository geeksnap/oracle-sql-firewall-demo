## Context

Market Explorer (`/market`) already implements two presenter-facing behaviors from the archived `market-explorer-waf-alert` change:

1. A fixed single-line `<input type="text">` for the attack search field (no dropdown/datalist).
2. A native `window.alert()` when `POST /api/market/search` returns HTTP **403** from OCI WAF.

Attack Points 2–4 still submit via `wafMirrorUrl` but do not inspect `res.status` for **403** and do not show the WAF alert. Bulk Action uses a multi-line `<textarea>` for the attack memo field, which does not match the Market input pattern.

## Goals / Non-Goals

**Goals:**
- One shared helper for WAF block detection and alert text across all four attack points.
- Identical presenter message on every screen: *"SQL injection detected by OCI WAF and blocked."*
- Inline error persists after alert on every attack screen.
- Market search remains a fixed plain text input; Bulk attack input converted to the same pattern.
- Transaction History and Statement attack inputs gain `autoComplete="off"` where missing.

**Non-Goals:**
- Changing navbar `UniversalSearchBar` dropdown behavior.
- Custom modal/toast components.
- API or WAF rule changes.
- Removing WAF-bypass hint rows on Transaction History (out of scope).

## Decisions

### 1. Shared helper module

**Choice:** Add `luminaforge/src/lib/waf-block-alert.ts` exporting:

```ts
export const WAF_BLOCK_ALERT_MESSAGE =
  "SQL injection detected by OCI WAF and blocked.";

export function alertIfWafBlocked(status: number): boolean;
export function wafBlockErrorMessage(status: number, fallback?: string): string;
```

**Rationale:** Single source of truth for message text and **403** handling; Market refactors to use the helper instead of inline `window.alert`.

### 2. Check HTTP status before parsing JSON body

**Choice:** Each attack fetch checks `res.status === 403` immediately after the response returns, calls `alertIfWafBlocked(403)`, sets inline error via `wafBlockErrorMessage`, and returns without treating the body as success.

**Rationale:** OCI WAF may return **403** with a non-JSON or empty body; current Statement/Bulk paths only read `data.error` and miss WAF blocks.

**Routes affected:**
| Attack point | Route | Component |
|---|---|---|
| 1 | `POST /api/market/search` | `market/page.tsx` |
| 2 | `POST /api/transactions/filter` | `TransactionHistoryLookup.tsx` |
| 3 | `POST /api/statement/generate` | `statement/page.tsx` |
| 4 | `POST /api/bulk/execute` | `BulkActionPanel.tsx` |

### 3. Bulk textarea → fixed single-line input

**Choice:** Replace Bulk `Batch Execution Note` `<textarea>` with `<input type="text">`, `autoComplete="off"`, fixed height, monospace — matching Market.

**Alternative considered:** Keep textarea for long stacked payloads — rejected; user requested simple fixed text input like Market.

### 4. Market input regression guard

**Choice:** No structural Market UI change unless regression found; refactor to shared helper only.

## Risks / Trade-offs

- **[Risk] Very long Bulk payloads harder to read in single-line input** → Acceptable; presenters paste canonical short payloads; horizontal scroll handles overflow.
- **[Risk] `window.alert` blocks UI on every screen** → Consistent with Market demo pattern; intentional for presenter visibility.
- **[Risk] Non-WAF **403** shows same alert** → Acceptable in closed demo environment.

## Migration Plan

1. Add shared helper and wire all four attack fetch paths.
2. Convert Bulk textarea to single-line input.
3. Add `autoComplete="off"` on Transaction and Statement attack inputs.
4. Build locally; verify **403** on LB URL for canonical payloads per attack point.
5. Deploy to demo VM and verify presenter flow.

## Open Questions

None.

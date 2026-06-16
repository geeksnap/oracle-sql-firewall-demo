## Context

The Market Explorer page (`/market`) currently uses a multi-line `<textarea>` for SQL injection demo payloads. Presenters report that the control feels like a dropdown-style field (resize grip, multi-line affordance) and that WAF blocks are only shown as inline red error text. OCI WAF returns HTTP **403** for canonical SQLi payloads on the load-balancer URL; the app already detects **403** and sets `error` state but does not surface a modal alert.

The navbar `UniversalSearchBar` retains its own dropdown results UI on all pages; this change scopes input UX to the Market Explorer search card only.

## Goals / Non-Goals

**Goals:**
- Market Explorer search card uses a plain single-line `<input type="text">` with no datalist, select, or suggestion dropdown.
- Disable browser autocomplete/history suggestions on that field (`autoComplete="off"`, `spellCheck={false}`).
- On HTTP **403** from `POST /api/market/search`, call `window.alert()` with a clear OCI WAF block message before or alongside the existing inline error.
- Preserve Enter-to-search, monospace styling, and existing SQLi demo hint rows.

**Non-Goals:**
- Changing navbar Universal Search Bar behavior.
- Re-introducing WAF-bypass hint rows or payloads.
- API, database, or Terraform/WAF rule changes.
- Custom modal component (native `alert` is sufficient for demo clarity).

## Decisions

### 1. Single-line `<input>` instead of `<textarea>`

**Choice:** Replace `<textarea rows={2}>` with `<input type="text">`.

**Rationale:** User directive explicitly rejects a “pull down box” for the text box. A single-line input removes resize affordance and matches typical search-bar UX while still accepting full SQLi strings.

**Alternative considered:** Keep textarea with `resize-none` — rejected because multi-line control still reads as non-standard for “search”.

### 2. Native `window.alert` for WAF **403**

**Choice:** When `res.status === 403`, invoke:

```ts
window.alert("SQL injection detected by OCI WAF and blocked.");
```

**Rationale:** Maximum visibility during live demos; no new UI dependencies.

**Alternative considered:** Toast or inline-only — rejected per user request for a pop-out alert.

### 3. Dual feedback (alert + inline error)

**Choice:** Keep setting `setError(...)` on **403** in addition to the alert.

**Rationale:** Alert is dismissed quickly; inline error persists on the page for screenshots and follow-up narration.

### 4. WAF detection keyed on HTTP status only

**Choice:** Treat `res.status === 403` as OCI WAF block for alert purposes (not parsing response body).

**Rationale:** Matches existing demo stack behavior and `waf-sql-firewall-differentiation-demo` spec.

## Risks / Trade-offs

- **[Risk] `window.alert` blocks the main thread** → Acceptable for infrequent demo clicks; presenters trigger WAF blocks deliberately.
- **[Risk] Browser may still show autocomplete despite `autoComplete="off"`** → Mitigate with `name="market-search-q"` (non-standard name) and `autoComplete="off"`; document that presenters can clear browser history if needed.
- **[Risk] Non-WAF **403** would show same alert** → Acceptable in this closed demo; only WAF and app both use **403** on LB path for blocked SQLi.

## Migration Plan

1. Implement UI changes in `market/page.tsx`.
2. Build and deploy LuminaForge to demo VM; verify on LB URL with `' OR '1'='1` → alert + inline error.
3. Verify benign search (`ORCL`) still returns **200** without alert.
4. Archive change after `/opsx:apply` and presenter sign-off.

## Open Questions

None — requirements are explicit from the user directive.

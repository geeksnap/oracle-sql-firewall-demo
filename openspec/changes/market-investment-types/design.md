## Context

The current Market page demonstrates SQL injection and firewall behavior using luxury goods as the business domain. This obscures the intended financial-security narrative and makes search examples less relevant to market operations. The change must preserve the existing vulnerable-query demo ladder (boolean bypass, schema discovery, column discovery) while replacing user-facing catalog semantics with investment instruments and price-oriented market data.

Constraints:
- Keep the current Market demo route structure and SQLi demonstration mechanics intact.
- Avoid introducing new external market data dependencies for this change; use controlled demo data.
- Keep compatibility with OCI WAF + Oracle SQL Firewall demonstration paths already present in Luminaforge.

Stakeholders:
- Demo presenters who need finance-relevant examples.
- Security reviewers comparing WAF block behavior and SQL Firewall visibility.
- Product owners aligning the demo narrative with investment operations.

## Goals / Non-Goals

**Goals:**
- Reframe Market search as investment instrument lookup by ticker/type rather than luxury item browsing.
- Provide representative demo instruments across stocks, bonds, ETFs, crypto, and precious metals.
- Ensure displayed labels and result cards consistently reflect investment-market terminology.
- Preserve existing SQLi educational steps and metadata leak rendering behavior.

**Non-Goals:**
- Real-time price feed integration from external providers.
- Reworking transaction, statement, or bulk modules in this change.
- Changing core vulnerable SQL construction patterns used by the attack demonstrations.

## Decisions

1. **Use static/demo investment catalog values instead of live market APIs**
   - **Why:** Keeps the demo deterministic, avoids network/API credential dependencies, and minimizes runtime failure modes during presentations.
   - **Alternative considered:** Pull delayed market prices from external APIs. Rejected for reliability, rate-limit risk, and added operational complexity.

2. **Retain current Market API contract (`/api/market/search`) while replacing domain vocabulary**
   - **Why:** Prevents unnecessary downstream integration changes and keeps attack workflow stable.
   - **Alternative considered:** Create a new endpoint dedicated to investment search. Rejected to avoid duplicating vulnerable demo logic and increasing maintenance cost.

3. **Introduce a dedicated spec capability for investment-pricing semantics**
   - **Why:** The domain shift is a behavior-level requirement, not only implementation detail, and should be tracked as a reusable capability.
   - **Alternative considered:** Only modify existing schema/column discovery capabilities. Rejected because domain requirements for catalog/search behavior need first-class coverage.

4. **Keep Market SQLi ladder but update hints/examples to investment context**
   - **Why:** Preserves instructional attack sequence while aligning visible examples with financial use cases.
   - **Alternative considered:** Remove SQLi hints entirely from Market. Rejected because this page is intentionally part of the attack-surface demo.

## Risks / Trade-offs

- **[Risk] Semantic mismatch between new investment labels and underlying demo table names** -> **Mitigation:** update UI copy and result display fields consistently; keep spec deltas explicit about terminology boundaries.
- **[Risk] Presenters may expect real-time pricing once investment instruments are shown** -> **Mitigation:** document that prices are demo/static values in capability specs and presenter notes.
- **[Risk] Existing tests/assertions tied to luxury asset names may fail** -> **Mitigation:** update fixtures and test expectations in the implementation tasks.
- **[Trade-off] No live-feed integration reduces realism for market volatility** -> **Mitigation:** prioritize reliability and repeatability for security demonstrations.

## Migration Plan

1. Add/change OpenSpec artifacts for investment-pricing behavior and market discovery deltas.
2. Update Market page copy, examples, and display semantics to investment instruments.
3. Update backing demo data/query fixtures with representative symbols and instrument categories.
4. Run local build/tests and smoke-check Market search + SQLi ladder behavior.
5. Deploy normally; rollback by restoring prior commit with luxury catalog values if needed.

Rollback strategy:
- Revert the Market module and associated fixtures/spec changes to the previous commit.
- Restart Luminaforge service and validate pre-change Market behavior.

## Open Questions

- Should bond examples include maturity/yield fields in card display, or remain price-only for parity with current layout?
- Should ETFs and mutual funds be modeled together or kept separate in category labels?
- Do we want a visible “demo/static price” badge on Market cards in this change, or defer to a later UX pass?

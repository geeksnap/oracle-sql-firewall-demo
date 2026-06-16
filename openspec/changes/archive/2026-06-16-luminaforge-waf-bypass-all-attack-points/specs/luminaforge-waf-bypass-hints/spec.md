## ADDED Requirements

### Requirement: Shared WAF-bypass payload constants for all attack points

The system SHALL expose finalized WAF-evasion payload strings in `luminaforge/src/lib/waf-bypass-demo-payloads.ts` for each LuminaForge attack point that has a proven or documented bypass. Constants SHALL include human-readable comments (hex decode, WAF rule evaded, expected HTTP status on LB URL). UI components SHALL import hint text from this module only — not duplicate payload strings inline.

#### Scenario: Attack Point 2 constant remains available
- **WHEN** a developer imports from `waf-bypass-demo-payloads.ts`
- **THEN** `ATTACK2_WAF_BYPASS_XML_HEX` is exported unchanged from the prior differentiation change

#### Scenario: Attack Point 1 bypass constant is defined
- **WHEN** a developer imports from `waf-bypass-demo-payloads.ts`
- **THEN** `ATTACK1_WAF_BYPASS_BOOLEAN` (or equivalent) exports a payload validated to return **200** on the OCI LB URL for `POST /api/market/search` with mirrored `q`

#### Scenario: Attack Points 3 and 4 constants are defined or explicitly deferred
- **WHEN** Tier B payload engineering succeeds during implementation
- **THEN** `ATTACK3_WAF_BYPASS_*` and `ATTACK4_WAF_BYPASS_*` constants are exported with validation notes
- **WHEN** Tier B engineering does not produce a working payload
- **THEN** constants or UI copy SHALL document that canonical payloads are WAF-blocked on the LB URL and direct `:3001` must be used for the full attack outcome

### Requirement: Secondary WAF-bypass hint on every attack screen

Each attack UI SHALL display a secondary monospace hint line below existing demo hints, showing the WAF-bypass payload constant for that screen. Primary canonical hints and fetch/`wafMirrorUrl` behaviour SHALL remain unchanged.

#### Scenario: Market Explorer shows WAF-bypass hint for step 1
- **WHEN** a presenter views `/market`
- **THEN** a secondary hint displays the Attack Point 1 WAF-bypass boolean payload
- **AND** existing step 1/2/3 canonical hints remain visible

#### Scenario: Transaction History WAF-bypass hint unchanged
- **WHEN** a presenter views `/transactions`
- **THEN** the existing secondary XML/hex hint for Attack Point 2 remains displayed

#### Scenario: Statement page shows WAF-bypass hint
- **WHEN** a presenter views `/statement`
- **THEN** a secondary hint displays the Attack Point 3 WAF-bypass payload or Tier B fallback message

#### Scenario: Bulk Action shows WAF-bypass hint
- **WHEN** a presenter views `/bulk`
- **THEN** a secondary hint displays the Attack Point 4 WAF-bypass payload or Tier B fallback message

### Requirement: WAF-bypass hints are validated on OCI before merge

Each constant shown in UI hints SHALL be tested on the live demo stack with mirrored query strings (`waf-query-mirror.ts` behaviour) before the change is merged.

#### Scenario: Attack Point 1 bypass passes WAF on LB URL
- **WHEN** the Attack Point 1 WAF-bypass payload is submitted via the Market search UI on `http://<lb_public_ip>/market`
- **THEN** OCI WAF returns **200** (not **403**)
- **AND** the grid returns all `luxury_items` rows (same outcome class as `' OR '1'='1`)

#### Scenario: Canonical payloads still blocked on WAF where documented
- **WHEN** a presenter submits canonical Attack Point 1 step 1 payload `' OR '1'='1` on the LB URL
- **THEN** OCI WAF returns **403**

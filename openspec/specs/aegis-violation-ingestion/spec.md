# aegis-violation-ingestion Specification

## Purpose
TBD - created by archiving change aegis-report-all-violations. Update Purpose after archive.
## Requirements
### Requirement: Status update reports all fetched firewall violations without deduplication

The Aegis Vault status-update pipeline SHALL include every row returned from the metrics violation fetch (up to `METRICS_VIOLATION_LIMIT`) in the `violations-snapshot` WebSocket payload. The pipeline SHALL NOT skip rows because they were seen in a prior poll (`seenViolationIds` or equivalent in-process dedup sets).

#### Scenario: Repeated attack creates multiple ledger rows

- **WHEN** Oracle logs multiple violations for the same SQL text at different `occurred_at` timestamps
- **THEN** each occurrence SHALL appear as a separate row in `violations-snapshot`
- **AND** each SHALL be eligible for a `violation` socket event when newly observed

#### Scenario: Snapshot row count matches fetch window

- **WHEN** the dictionary holds N violation rows within the fetch limit (N ≤ `METRICS_VIOLATION_LIMIT`)
- **THEN** `violations-snapshot` SHALL contain N rows (plus any break-glass rows), not a reduced deduplicated count

### Requirement: Violation row identity preserves distinct occurrences

Each mapped violation SHALL have an `id` that distinguishes separate log occurrences. When username, SQL identity, and `occurred_at` are insufficient to distinguish two rows in one fetch, the mapper SHALL add a per-fetch sequence suffix so merge and client logic do not collapse them.

#### Scenario: Flush duplicates in one poll

- **WHEN** two dictionary rows share the same normalized SQL and `occurred_at` in one status update
- **THEN** both SHALL remain in the snapshot with different `id` values

### Requirement: Break-glass merge does not collapse rows by id

Merging break-glass synthetic violations with dictionary rows SHALL preserve all entries up to the merge limit without using a single-entry-per-`id` map that drops duplicates.

#### Scenario: Break-glass plus dictionary rows

- **WHEN** break-glass entries exist alongside dictionary violations
- **THEN** the merged list SHALL include both sets ordered by time, capped only by the merge limit

### Requirement: Attack reporting is not suppressed by endpoint cooldown

The server SHALL NOT suppress violation rows or `violation` events based on a per-SQL-skeleton cooldown. Optional banner or globe debounce on the client MAY remain but SHALL NOT remove rows from Latest Threats or Live Violations.

#### Scenario: Same endpoint triggered twice within cooldown window

- **WHEN** two LuminaForge violations for the same attack endpoint occur within three minutes
- **THEN** both SHALL appear in the violation ledger
- **AND** both SHALL be present in `violations-snapshot` on the next status update


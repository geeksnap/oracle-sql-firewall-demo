# aegis-threat-feed-full-sql Specification

## Purpose
Historical Threat Feed split layout — superseded by Dashboard Latest Threats after Command Nav simplification.

## Requirements

### Requirement: Threat Feed nav section is retired
The Aegis Vault application SHALL NOT expose a Command Nav **Threat Feed** section. Full SQL violation detail SHALL be available on the Dashboard **Latest Threats** block and the right-rail **Live Violations** table instead.

#### Scenario: No Threat Feed nav entry
- **WHEN** the user views Command Nav
- **THEN** **Threat Feed** SHALL NOT appear as a navigable section

#### Scenario: Full SQL remains on Dashboard
- **WHEN** the user is on the Dashboard
- **THEN** the Latest Threats table with Full SQL detail SHALL remain available

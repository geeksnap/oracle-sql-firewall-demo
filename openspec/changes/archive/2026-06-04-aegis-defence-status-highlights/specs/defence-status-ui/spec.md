## ADDED Requirements

### Requirement: Demo Control nav always dark red

The Command NAV **Demo Control** item SHALL use dark red styling in **inactive** and **active** states. Inactive Demo Control SHALL NOT use the same slate/gray text as primary nav items.

#### Scenario: Inactive Demo Control

- **WHEN** the user views Command NAV with a section other than Demo Control selected
- **THEN** the Demo Control label appears in dark red tones (e.g. light red text, dark red border/background tint), not `text-slate-400`

#### Scenario: Active Demo Control

- **WHEN** Demo Control is the selected section
- **THEN** the item uses a stronger dark red active highlight distinct from cyan primary nav items

### Requirement: Monitored Apps defence status highlights

Each Monitored App card SHALL display a **Defence status** highlight using the pill labels below, with **distinct visual styling per state** (pill and card accent).

| Condition | Pill label |
|-----------|------------|
| Allow-list on + block | `ENFORCED · BLOCK` |
| Allow-list on, log only | `ENFORCED · LOG` |
| Allow-list off | `ALLOW-LIST OFF` |
| Global firewall off | `FIREWALL OFF` |
| No allow-list row | `NOT CONFIGURED` |

#### Scenario: Enforced block

- **WHEN** the app has an enabled allow-list with block enforcement and global firewall is on
- **THEN** the pill shows `ENFORCED · BLOCK` with strong protective (green) emphasis

#### Scenario: Enforced log only

- **WHEN** the app has an enabled allow-list without block
- **THEN** the pill shows `ENFORCED · LOG` with warn/amber emphasis

#### Scenario: Allow-list off

- **WHEN** allow-list enforcement is disabled for that user
- **THEN** the pill shows `ALLOW-LIST OFF` with de-emphasized (orange/slate) styling

#### Scenario: Global firewall off

- **WHEN** SQL Firewall is globally disabled
- **THEN** the pill shows `FIREWALL OFF` with dark red styling for both monitored apps

#### Scenario: Not configured

- **WHEN** no allow-list row exists for that user
- **THEN** the pill shows `NOT CONFIGURED` with neutral/unknown styling

#### Scenario: Violations with defence pill

- **WHEN** the app has recent violations (`has_alert`)
- **THEN** the card MAY use alert border styling while the defence status pill still shows the correct label and state color

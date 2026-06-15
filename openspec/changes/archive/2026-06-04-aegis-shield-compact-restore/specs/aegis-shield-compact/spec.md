## ADDED Requirements

### Requirement: Compact force-field shield on dashboard

The dashboard SHALL render the 3D shield hero in a **fixed 360px-tall** panel using the compact wireframe globe composition (inner sphere + outer icosahedron, sparkles, starfield)—not the enlarged multi-mesh “Aegis Shield” layout from `aegis-vault-soc-ui-refresh`.

#### Scenario: Default dashboard layout

- **WHEN** the user opens the Dashboard section
- **THEN** the shield panel height is approximately 360px and does not use `min-h-[420px]` or `lg:min-h-[520px]` sizing

#### Scenario: Visual composition

- **WHEN** the shield is displayed in normal (non-alert) mode
- **THEN** the scene shows wireframe cyan sphere/icosahedron with sparkles (no torus ring or gold solid crest mesh)

#### Scenario: Footer label

- **WHEN** the shield panel is visible
- **THEN** the footer caption reads **Force-Field Shield Globe** (not “Aegis Shield” / “SQL Firewall Defense Field”)

### Requirement: Alert mode preserved

The compact shield SHALL retain alert-mode behavior from the SOC refresh: red/magenta emphasis and **LuminaForge Attacked** when `alertMode` is true.

#### Scenario: Attack alert styling

- **WHEN** `alertMode` is true
- **THEN** the shield uses alert colors and shows the LuminaForge attack message in the footer overlay

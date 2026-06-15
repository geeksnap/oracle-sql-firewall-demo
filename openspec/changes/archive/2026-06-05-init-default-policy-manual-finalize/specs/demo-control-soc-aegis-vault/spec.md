## ADDED Requirements

### Requirement: Init-default-policy success modal guides manual finalize

After **Initialize default demo policy** succeeds, Demo Control SHALL show a presenter-facing modal (not only output-console text) that explains automated preparation and manual completion steps.

#### Scenario: Modal content after init

- **WHEN** `init-default-policy` returns success
- **THEN** a modal SHALL appear describing completed steps: clear policy, capture started, baseline benign SQL, LuminaForge HTTP context capture
- **AND** the modal SHALL list next steps: run LuminaForge normally while capture is on, then **Stop SQL capture**, then **Generate Allow List**
- **AND** the user SHALL dismiss the modal with an explicit acknowledge control

#### Scenario: Modal does not block other Demo Control actions

- **WHEN** the modal is dismissed
- **THEN** Demo Control buttons including **Stop SQL capture** and **Generate Allow List** remain usable without page reload

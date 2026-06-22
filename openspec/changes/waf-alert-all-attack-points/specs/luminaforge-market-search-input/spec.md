## ADDED Requirements

### Requirement: Market search input is fixed single-line plain text

The Market Explorer search card SHALL use a fixed-height single-line `<input type="text">` for the attack query field. The control SHALL NOT resize, expand to multiple lines, or present dropdown, datalist, or typeahead suggestion UI tied to that field.

#### Scenario: Fixed single-line Market input

- **WHEN** the user views the Market Explorer search card
- **THEN** the query control SHALL be `<input type="text">` with fixed height styling
- **AND** the control SHALL NOT be a `<textarea>` or resizable multi-line field

#### Scenario: No dropdown on Market search field

- **WHEN** the user focuses or types in the Market search field
- **THEN** no application-rendered suggestion dropdown SHALL appear beneath that field
- **AND** the field SHALL include `autoComplete="off"` to discourage browser pull-down suggestions

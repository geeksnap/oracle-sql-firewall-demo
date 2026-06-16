## ADDED Requirements

### Requirement: Market Explorer search uses plain text input only

The Market Explorer search card on `/market` SHALL provide a single-line free-text input for the user query. The control SHALL NOT use `<select>`, `<datalist>`, combobox, typeahead, or any UI that presents a pull-down list of suggestions tied to the search field. Browser autocomplete SHALL be disabled on the field.

#### Scenario: Search field is a single-line text input

- **WHEN** the user views the Market Explorer search card
- **THEN** the primary query control SHALL be an `<input type="text">` (or equivalent single-line text field)
- **AND** the control SHALL NOT be a `<textarea>` or multi-line resizable field

#### Scenario: No suggestion dropdown on Market search

- **WHEN** the user focuses or types in the Market Explorer search field
- **THEN** the application SHALL NOT render a dropdown list of prior queries, instrument names, or categories beneath that field
- **AND** the field SHALL include `autoComplete="off"` (or stricter equivalent) to discourage browser pull-down suggestions

#### Scenario: Long SQLi payloads still fit in the input

- **WHEN** a presenter pastes a canonical step 2 or step 3 UNION payload into the Market search field
- **THEN** the full string SHALL be accepted and submitted on Search or Enter
- **AND** the field SHALL use horizontal scroll or ellipsis rather than expanding into a multi-line control

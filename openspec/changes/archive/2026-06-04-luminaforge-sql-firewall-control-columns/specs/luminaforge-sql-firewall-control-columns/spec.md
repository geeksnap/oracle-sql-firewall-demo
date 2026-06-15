## ADDED Requirements

### Requirement: Luminaforge section title SQL Firewall Control Center

Demo Control section 3 SHALL be titled **3. Luminaforge — SQL Firewall Control Center** (not “Firewall Control Center” alone).

#### Scenario: Section heading visible

- **WHEN** the user opens Demo Control
- **THEN** the Luminaforge section heading reads **3. Luminaforge — SQL Firewall Control Center**

### Requirement: Three-column layout for 3.1 3.2 3.3

Sub-sections **3.1 Firewall control**, **3.2 Firewall info**, and **3.3 Firewall setup** SHALL be presented as **three side-by-side columns** on medium and larger viewports (not stacked vertically only).

#### Scenario: Desktop three columns

- **WHEN** Demo Control is viewed at `md` breakpoint or wider
- **THEN** 3.1, 3.2, and 3.3 appear in a single row with three columns

#### Scenario: Mobile stack

- **WHEN** viewport is narrow
- **THEN** columns MAY stack vertically for readability

### Requirement: Independent SQL Monitor and Block SQL toggles

For user **luminaforge**, enabling or disabling **SQL Monitor** SHALL NOT change the **Block SQL** setting except when no allow-list row exists and Oracle requires `ENABLE_ALLOW_LIST` to create one. Enabling or disabling **Block SQL** SHALL NOT disable SQL Monitor when monitor is already **ENABLED**.

#### Scenario: Enable block with monitor already on

- **WHEN** SQL Monitor is ENABLED with block OFF and the user clicks **Enable block SQL**
- **THEN** `dba_sql_firewall_allow_lists` shows `STATUS=ENABLED` and `BLOCK=Y`

#### Scenario: Disable block with monitor on

- **WHEN** SQL Monitor is ENABLED with block ON and the user clicks **Disable block SQL**
- **THEN** `STATUS` remains ENABLED and `BLOCK=N` (log-only enforcement)

#### Scenario: Enable monitor preserves block flag

- **WHEN** SQL Monitor is disabled with `BLOCK=Y` armed and the user clicks **Enable SQL Monitoring**
- **THEN** SQL Monitor becomes ENABLED and `BLOCK` remains `Y` if it was set before disable

#### Scenario: Disable monitor does not require block off in UI

- **WHEN** the user clicks **Disable SQL Monitoring** while block was ON
- **THEN** SQL Monitor shows OFF in Monitored Apps / Policy rail; block armed state MAY still show in dictionary until explicitly disabled

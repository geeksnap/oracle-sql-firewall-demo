## REMOVED Requirements

### Requirement: Threat Feed uses a split layout with Full SQL panel
**Reason**: Threat Feed is no longer a Command Nav section; Latest Threats on Dashboard provides table + Full SQL for demos.
**Migration**: Use Dashboard **Latest Threats** and right-rail **Live Violations**; no Threat Feed route.

### Requirement: Row selection drives Full SQL content
**Reason**: Threat Feed section removed from navigation.
**Migration**: Select rows in Dashboard Latest Threats for Full SQL detail.

### Requirement: Full SQL panel supports long statements
**Reason**: Threat Feed section removed; Full SQL scrolling remains on Dashboard via `ViolationsWithFullSql`.
**Migration**: No action — behavior preserved on Dashboard.

# Spec Delta

## ADDED Requirements

### Requirement: Break-Glass is filled and seed init is outline
Command Nav SHALL keep **Break-Glass Control** as the filled destructive control and **Initialize Demo Seed Data** as the outline destructive action directly below it. Swapping those two treatments SHALL NOT add a third navigable section.

#### Scenario: Presenter views destructive sidebar controls
- **WHEN** the Aegis Vault dashboard loads
- **THEN** **Break-Glass Control** uses the filled destructive background treatment
- **AND** **Initialize Demo Seed Data** uses the outline destructive treatment
- **AND** **Initialize Demo Seed Data** remains a non-navigation action below **Break-Glass Control**

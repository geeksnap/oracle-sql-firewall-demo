# Spec Delta

## MODIFIED Requirements

### Requirement: Two-stack Console deploy order is documented and supported
The Console deploy path MUST keep the existing correlation model: apply the database stack first, then apply the compute stack with `db_stack_id` set to the database stack OCID.

#### Scenario: Compute stack without db_stack_id fails clearly
- **WHEN** a user attempts to plan or apply the compute stack in Resource Manager without a valid `db_stack_id`
- **THEN** Terraform validation or documentation MUST prevent a silent misconfigure (empty remote state) and direct the user to set the DB stack OCID

#### Scenario: Compute stack Plan with only db_stack_id
- **WHEN** a user plans the compute stack in Resource Manager (Terraform 1.5+) with a valid `db_stack_id` and without a local `terraform.tfstate` / without setting `db_state_path`
- **THEN** Terraform MUST load the configuration and MUST NOT fail with `Invalid reference in variable validation`
- **AND** any `validation` block on `variable "db_stack_id"` MUST refer only to `var.db_stack_id` (it MUST NOT reference `var.db_state_path`)

#### Scenario: Resource Manager does not require db_state_path
- **WHEN** a user creates the compute stack from the published package in Resource Manager
- **THEN** `schema.yaml` MUST NOT mark `db_state_path` as required
- **AND** local CLI MAY still use `db_state_path` (default `../db/terraform.tfstate`) when `db_stack_id` is unset

#### Scenario: Documented happy path
- **WHEN** a user follows the GitHub download → OCI Console quickstart path
- **THEN** the docs MUST describe package download, DB stack Apply, copying the DB stack OCID, compute stack Apply with `db_stack_id`, and where to find app URLs / outputs — without requiring local `terraform apply`

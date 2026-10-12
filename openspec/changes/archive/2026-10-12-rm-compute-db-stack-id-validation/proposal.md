# Proposal

## Why

OCI Resource Manager Plan of the compute stack fails at configuration load with `Invalid reference in variable validation` on `fileexists(var.db_state_path)` inside `variable "db_stack_id"`. Terraform 1.5+ (including Resource Manager) allows a variable `validation` condition to refer only to that variable. Filling `db_stack_id` does not unblock Plan. Users following Option B (Thin Mode after compute) cannot proceed without a new compute zip.

## What Changes

- Remove the cross-variable `validation` on `db_stack_id`.
- Keep the OCID-format `validation` (self-reference only).
- Enforce “have a DB source” for local CLI via a `lifecycle` precondition on `data.terraform_remote_state.db_local` (skipped when `db_stack_id` is set).
- Document that Resource Manager Plan needs only `db_stack_id` and that the published `orm-stacks-20261010` compute zip cannot be unblocked by pasting the OCID.

## Capabilities

### New Capabilities

*(None.)*

### Modified Capabilities

- `oci-console-terraform-bundle`: Resource Manager compute Plan MUST succeed with only `db_stack_id`; `db_state_path` remains local-CLI-only.

## Impact

- `terraform/compute/variables.tf`, `terraform/compute/main.tf`
- `openspec/specs/oci-console-terraform-bundle/spec.md`
- `terraform/OCI-QUICK-DEPLOYMENT.md` (and related troubleshooting rows)
- No app code, no new OCI stacks, no merge of this change as part of the proposal

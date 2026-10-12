# Design

## Context

`variable "db_stack_id"` had two validations. The first ORed a non-empty `db_stack_id` with `fileexists(var.db_state_path)`. Terraform rejects that at **config load**, before evaluating the condition, so a filled OCID still fails Resource Manager Plan.

## Decision

Keep Console correlation as `db_stack_id` → `oci_resourcemanager_stack_tf_state`. Move the local-file existence check to `data.terraform_remote_state.db_local` `lifecycle.precondition`, which may reference other variables and is skipped when `local.use_rm_db_state` is true (`count = 0`).

## Alternatives considered

- `check` block: Terraform 1.5+ checks warn on Plan; they do not fail the job.
- Require `db_state_path` in Resource Manager: rejected (job runner has no local tfstate; schema does not require it).

## Local CLI

Unset `db_stack_id` (null) still selects `db_local` with default `../db/terraform.tfstate`. Missing file fails the precondition with the same Console-vs-CLI message as before.

# Tasks

- [x] 1. Reproduce Terraform 1.5 `Invalid reference in variable validation` with `db_stack_id` set
- [x] 2. Remove cross-variable `validation` from `terraform/compute/variables.tf`; keep OCID self-check
- [x] 3. Add `lifecycle.precondition` on `data.terraform_remote_state.db_local` for local CLI
- [x] 4. Add spec scenarios for Plan-with-only-`db_stack_id` and schema not requiring `db_state_path`
- [x] 5. Update quick-deploy (and related troubleshooting) that filling `db_stack_id` does not unblock the old zip
- [x] 6. `terraform validate` the compute variable graph; confirm schema.yaml still does not require `db_state_path`

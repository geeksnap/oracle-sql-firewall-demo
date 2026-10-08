# Proposal

## Why

The repo already has working OCI Terraform (`terraform/db` + `terraform/compute`) and Console docs, but other users still cannot **download a ready-to-upload Resource Manager package from GitHub** and deploy in the OCI Console without cloning and running `package-stacks.sh` locally. Stack zips are gitignored, there is no Resource Manager variable schema for the Console wizard, and example configs still embed real-looking demo passwords and a live compartment OCID — friction and risk for public reuse.

## What Changes

- Publish a **GitHub-downloadable OCI Resource Manager bundle** for the existing two stacks (DB then compute) so users can upload zips in **Developer Services → Resource Manager → Stacks** without inventing a parallel Terraform layout.
- Add **Resource Manager `schema.yaml`** (per stack) so Console Create Stack presents validated variables (region, compartment OCID, SSH key, `db_stack_id`, etc.) instead of a blank Variables tab.
- Improve **packaging + release path**: keep `package-stacks.sh` as the source of truth; add a repeatable way to produce and attach `sqlfw-db-stack.zip` / `sqlfw-compute-stack.zip` for download (GitHub Release assets and/or a documented `terraform/dist/` publish step). Do **not** commit secrets or real passwords into zips.
- Harden **public examples** to placeholders (`CHANGE_ME`, example OCIDs) while preserving local CLI `*.tfvars.example` guidance with clearly marked demo-only patterns.
- Update **root README + `OCI-CONSOLE-QUICKSTART.md`** with a “Download from GitHub → Console Deploy” path that does not require local Terraform CLI for the happy path.
- **No** new parallel single-stack rewrite of DB/VCN/compute unless packaging proves the two-stack RM correlation (`db_stack_id`) is untenable for download users — prefer packaging what exists.

## Capabilities

### New Capabilities

- `oci-console-terraform-bundle`: GitHub-published, Resource Manager–ready Terraform packaging (zips + `schema.yaml` + docs) so third parties can download and deploy the SQL Firewall demo via OCI Console Stacks using the existing db + compute stacks.

### Modified Capabilities

*(None — no app-level requirement changes in Aegis Vault / LuminaForge specs.)*

## Impact

- `terraform/db/`, `terraform/compute/` — add RM `schema.yaml`; ensure zip root layout remains Console-valid; optional small variable description tweaks for schema binding.
- `terraform/package-stacks.sh` — include `schema.yaml`, exclude secrets/state/`*.tfvars`, emit checksums or manifest for published assets.
- `terraform/OCI-CONSOLE-QUICKSTART.md`, `terraform/README.md`, root `README.md` — download + Console deploy path; keep local CLI path.
- `.github/workflows/` (or release docs) — build/attach stack zips on tag/release (preferred over committing binary zips on every commit).
- Example tfvars / docs — replace committed real compartment OCID and hardcoded demo passwords in **user-facing download materials** with placeholders (implementation must not ship live credentials).
- App SPECs (`SPEC-aegis.md`, `SPEC-luminaforge.md`) — no functional change; apps remain cloned by compute cloud-init from GitHub `main`.

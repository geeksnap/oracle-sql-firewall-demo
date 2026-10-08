# Tasks

## 1. Resource Manager schemas

- [ ] 1.1 Add `terraform/db/schema.yaml` covering Console variables (region, compartment_id, ssh_public_key, db_home_version, allow_ssh_cidr, pdb_name, project_prefix, sensitive sys/app passwords) and verify YAML parses (`python3 -c "import yaml; yaml.safe_load(open('terraform/db/schema.yaml'))"` or equivalent) with required keys present
- [ ] 1.2 Add `terraform/compute/schema.yaml` covering region, compartment_id, ssh_public_key, db_stack_id, github_repo_url, github_branch, enable_waf, optional sensitive overrides and verify YAML parses with `db_stack_id` marked required for Console use
- [ ] 1.3 Cross-check schema variable names against `variables.tf` in each stack and verify every schema variable exists in Terraform (no orphan schema keys)

## 2. Packaging script and publish path

- [ ] 2.1 Update `terraform/package-stacks.sh` to include `schema.yaml`, continue excluding state/tfvars/credentials, and print checksums; verify `./package-stacks.sh` produces both zips with `schema.yaml` at zip root (`unzip -l`)
- [ ] 2.2 Add a GitHub Actions workflow (or release script) that builds both stack zips from the tagged/committed terraform trees and uploads them as Release assets named `sqlfw-db-stack.zip` and `sqlfw-compute-stack.zip`; verify workflow YAML validates (`actionlint` if available, else structural review) and dry-run packaging succeeds in CI/local
- [ ] 2.3 Add a short `terraform/DOWNLOAD.md` (or equivalent section) listing exact download asset names and verify links resolve relative to repo paths

## 3. Public example hardening

- [ ] 3.1 Replace live compartment OCID and hardcoded demo passwords in user-facing `terraform.tfvars.example` / Console variable tables with placeholders; verify `rg` finds no `ocid1.compartment.oc1..aaaaaaaaqcvjcdgexiyboeveqjc3izpzgk52mjmcf5qcelz2fvdbmhdg6b6q` in those published example paths
- [ ] 3.2 Ensure packaged zips never contain real tfvars or secrets; verify `unzip -l sqlfw-*-stack.zip` shows no `*.tfvars` (except examples if intentionally included) and no `terraform.tfstate*`

## 4. Documentation (Console-first download path)

- [ ] 4.1 Update `terraform/OCI-CONSOLE-QUICKSTART.md` Step 1 to lead with GitHub Release download of both zips (keep `package-stacks.sh` as alternate) and verify the numbered DB→compute `db_stack_id` flow still matches schema variable names
- [ ] 4.2 Update `terraform/README.md` Resource Manager section for the download path and verify it links to the quickstart + download instructions
- [ ] 4.3 Update root `README.md` documentation table / OCI deploy pointer so third parties see “download Console Terraform zips” and verify the link targets the new download docs

## 5. Integration verification

- [ ] 5.1 Run `./package-stacks.sh` after schemas/docs land and verify both zips extract cleanly with `.tf` + `schema.yaml` at root and `terraform validate` succeeds for each stack directory when providers can initialize (or document skip if OCI provider auth unavailable in the environment)
- [ ] 5.2 Confirm no application code under `aegis-vault/` / `luminaforge/` was changed by this work (`git diff --name-only` scoped review)

## Workflow follow-up

- Human review of this OpenSpec change before `/opsx:apply`.
- After implementation and validation, archive with `/opsx:archive`.
- Optional: cut a GitHub prerelease with both zips once the release workflow lands.

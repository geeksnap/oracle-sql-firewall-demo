# Tasks

## 1. DB stack — SSH path for sqlnet

- [ ] 1.1 Add `hashicorp/tls` to `terraform/db/versions.tf` and verify `required_providers` lists both `oracle/oci` and `hashicorp/tls`
- [ ] 1.2 Add `tls_private_key` (ED25519) in `terraform/db` and set `oci_database_db_system.sqlfw.ssh_public_keys` to the presenter `var.ssh_public_key` **plus** the generated public key; verify the resource is no longer a single-element `[var.ssh_public_key]` list
- [ ] 1.3 Add sensitive output `db_bootstrap_ssh_private_key` in `terraform/db/outputs.tf` and verify it is marked `sensitive = true` and does not appear in any non-sensitive output
- [ ] 1.4 Add `db_sl` ingress TCP 22 from `var.compute_subnet_cidr` (keep existing `allow_ssh_cidr` SSH rule) and verify `terraform/db/main.tf` has both SSH sources; do **not** add a NAT gateway or IGW default on `db_rt`
- [ ] 1.5 Confirm `schema.yaml` still does not ask for a bootstrap private key and verify `rg 'bootstrap' terraform/db/schema.yaml` is empty (or docs-only)

## 2. Compute stack — apply cloned sqlnet before bootstrap

- [ ] 2.1 Read `db_bootstrap_ssh_private_key` from existing DB remote state in `terraform/compute/main.tf` and pass it into `cloud-init.yaml.tftpl` as base64 (same pattern as `sys_password_b64`); verify `templatefile` arguments include the new field and that a missing output would fail Plan
- [ ] 2.2 Add `openssh-client` to cloud-init `packages` and verify it appears next to `git` / `curl` / `jq` / `ufw`
- [ ] 2.3 After the `:1521` wait and **before** `oci-bootstrap-database.mjs`, write `/root/.ssh/db_bootstrap` (`chmod 600`) and pipe `$REPO_DIR/scripts/configure-db-sqlnet-for-thin-mode.sh` to `opc@$HOST` via `ssh -i … BatchMode=yes ConnectTimeout=15 StrictHostKeyChecking=no 'sudo bash -s'`; verify the script path is the clone (not a URL) and that failure exits non-zero with no `curl`/`raw.githubusercontent.com` fallback
- [ ] 2.4 Search `terraform/compute` for `raw.githubusercontent.com` and `configure-db-sqlnet` download URLs and verify the only sqlnet invocation is the clone pipe

## 3. Deployment docs (no Option A/B curl)

- [ ] 3.1 Rewrite `terraform/OCI-CONSOLE-QUICKSTART.md` Step 2c so the happy path is compute cloud-init (no required Bastion/Option B); add recovery as `sudo cat` clone `| ssh opc … sudo bash -s`; verify the file contains no `curl -fsSL https://raw.githubusercontent.com/`
- [ ] 3.2 Rewrite `terraform/OCI-QUICK-DEPLOYMENT.md` §12 the same way (recovery subsection only; no laptop hop before compute Apply) and verify no `curl -fsSL https://raw.githubusercontent.com/` remains; update §16 “If you used Thin Mode Option B…” to the recovery pipe + re-run install
- [ ] 3.3 Update `terraform/README.md` NJS-533 / ORA-12660 troubleshooting row to automatic sqlnet + recovery pipe (not GitHub curl on DB) and verify it links to the revised Step 2c, not Option B curl
- [ ] 3.4 Leave `terraform/DOWNLOAD.md` on `orm-stacks-20261012` until a new tag exists; add a one-line note that sqlnet auto-provision needs the **next** RM tag (both zips); verify the file still does **not** claim `orm-stacks-20261012` applies sqlnet at provision
- [ ] 3.5 `rg -n 'curl -fsSL https://raw.githubusercontent.com/' terraform/` and verify zero matches in `OCI-CONSOLE-QUICKSTART.md`, `OCI-QUICK-DEPLOYMENT.md`, `README.md`, and `DOWNLOAD.md`

## 4. Integration checks (after 1–3; still no live Apply)

- [ ] 4.1 Run `./terraform/package-stacks.sh` and verify both zips have `.tf` + `schema.yaml` at root, contain no `*.tfvars` / `terraform.tfstate*` / private key files (`unzip -l`), and that `hashicorp/tls` is in the DB zip `versions.tf`
- [ ] 4.2 Confirm no application code under `aegis-vault/` / `luminaforge/` changed (`git diff --name-only`) and that `scripts/configure-db-sqlnet-for-thin-mode.sh` is unchanged
- [ ] 4.3 Do **not** Apply either zip onto live demo `161.33.154.45` or Destroy any DB; verify the implementation PR description states new empty compartment (or new stacks) as the consumer

## Workflow follow-up

- Human review of this OpenSpec change before `/opsx:apply`. This spec-review PR MUST NOT implement Terraform, package zips, or bump DOWNLOAD versions.
- After implementation and validation, cut a **new** GitHub RM tag with **both** zips, then point `DOWNLOAD.md` at that tag (not `orm-stacks-20261012`).
- Before archive, wrap `openspec/specs/compute-ubuntu-thin/spec.md` requirements in `## Requirements` (pre-existing structural issue; `openspec validate --strict` warns archive would refuse the delta otherwise).
- Archive with `/opsx:archive` after the new zips are published.
- Optional: mirror recovery text into store docs (`oci-quick-deployment-steps.md`, `rm-compute-apply-latest.md`) once repo docs land; `cloud-init-error-recovery.md` is owned by another worker.

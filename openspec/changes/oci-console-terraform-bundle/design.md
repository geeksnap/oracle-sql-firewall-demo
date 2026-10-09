# Design

## Context

See proposal.md — Why. Current state on `main` (`b4212db`):

- Two correlated stacks: `terraform/db` (VCN + Base DB 26ai) and `terraform/compute` (Ubuntu 24.04 VM, apps, optional LB/WAF).
- Console path already exists: `package-stacks.sh` → upload zips → set `db_stack_id` on compute (`oci_resourcemanager_stack_tf_state`).
- Gaps: zips gitignored (`sqlfw-*-stack.zip`); no RM `schema.yaml`; happy path still assumes clone + local packaging; `*.tfvars.example` embeds a real compartment OCID and demo passwords (also flagged in project sensitive-info review).
- Prefer packaging/improving these stacks over a greenfield single-stack rewrite.

## Goals / Non-Goals

**Goals:**

- Make the existing stacks downloadable and Console-first for third parties.
- Add RM schemas so Create Stack is guided.
- Publish zips via a repeatable GitHub path (Release assets preferred).
- Strip secrets from published artifacts and public examples.
- Keep local CLI path working (`db_state_path`).

**Non-Goals:**

- Merging DB + compute into one Resource Manager stack in this change.
- Changing app runtime, SQL Firewall demo logic, or Aegis/LuminaForge SPECs.
- Committing live `terraform.tfvars` or real SSH private keys.
- Fixing the live VM `:80` nginx→WAF redirect ops item (unrelated).
- Requiring users to install Oracle Instant Client (Thin Mode remains).

## Decisions

### 1) Package existing two stacks; do not invent a parallel stack

**Choice:** Continue DB-then-compute with `db_stack_id` for Resource Manager.

**Rationale:** Already implemented and documented; Base DB Apply is long-running — separate stacks match operational reality (re-apply compute without rebuilding DB).

**Alternatives considered:**

| Alternative | Why not now |
|-------------|-------------|
| Single mega-stack zip | Large blast radius; harder partial re-apply; big rewrite of remote-state coupling |
| VCN-only third stack | Extra Console step; contradicts “VCN is included” quickstart |

### 2) Publish via GitHub Release assets (not permanent binary commits)

**Choice:** CI/workflow (or documented release script) runs `package-stacks.sh` and attaches `sqlfw-db-stack.zip` + `sqlfw-compute-stack.zip` to a GitHub Release (and/or writes them under a `terraform/dist/` artifact path that is release-published). Keep `sqlfw-*-stack.zip` gitignored on the working tree.

**Rationale:** Zips are build products; Releases give a clear “Download” UX for Console users who never clone. Source of truth remains `.tf` + `schema.yaml` in git.

**Alternatives considered:**

| Alternative | Trade-off |
|-------------|-----------|
| Commit zips on every merge | Repo churn / binary noise; easy to drift from source |
| Only document `package-stacks.sh` | Fails the user ask for downloadable GitHub content |

Tiny scaffolding allowed in propose/apply: workflow file stub, `schema.yaml` stubs, packaging script updates — full zip generation verified at apply time.

### 3) Add `schema.yaml` per stack (ORM variable UI)

**Choice:** Add OCI Resource Manager `schema.yaml` beside each stack’s `.tf` files; `package-stacks.sh` includes them in the zip root.

**Minimum variable coverage:**

| Stack | Schema variables (representative) |
|-------|-----------------------------------|
| DB | `region`, `compartment_id` (OCI compartment control), `ssh_public_key`, `db_home_version`, `allow_ssh_cidr`, `pdb_name`, `project_prefix`, sensitive `sys_password` / `app_db_password` |
| Compute | `region`, `compartment_id`, `ssh_public_key`, `db_stack_id`, `github_repo_url`, `github_branch`, `enable_waf`, optional password overrides |

**Rationale:** Console users currently face a blank Variables tab; schema is the ORM-native way to make stacks “ready to deploy.”

### 4) Placeholders in public examples; sensitive values only in Console Variables

**Choice:** Replace committed example compartment OCID and demo passwords in user-facing example materials with placeholders. Defaults in `variables.tf` for demo passwords (if retained for local workshop convenience) must be clearly demo-only and must not be the only documented Console path — Console docs instruct users to set/rotate passwords in Variables.

**Rationale:** Aligns with sensitive-info review and public GitHub reuse. Resource Manager marks sensitive vars when schema declares them.

### 5) Docs: Download → Console as primary third-party path

**Choice:** Lead `OCI-CONSOLE-QUICKSTART.md` (and root README pointer) with:

1. Download Release zips (or build via `package-stacks.sh` from clone).
2. Create/apply DB stack in Resource Manager.
3. Copy DB stack OCID → compute stack Variables → Plan/Apply.
4. Wait for cloud-init; open `:3000` / `:3001` / WAF LB URL from outputs.

Keep local CLI section secondary.

## Risks / Trade-offs

- **[Risk] Two-stack correlation confuses new users** → Mitigation: schema titles/descriptions + quickstart numbered steps; validation already requires `db_stack_id` or local state.
- **[Risk] Release zips drift from `main`** → Mitigation: release workflow packages from the tagged commit; docs say “use latest release matching the branch you want.”
- **[Risk] Removing hardcoded demo passwords breaks workshop muscle memory** → Mitigation: document generating compliant passwords; optional non-committed local tfvars samples for maintainers only.
- **[Risk] `schema.yaml` type mismatches cause Create Stack errors** → Mitigation: validate against ORM schema docs; smoke Create Stack in a test tenancy during apply if credentials available, else dry-check YAML structure in CI.
- **[Trade-off] Not merging stacks** → Slightly more Console clicks, but preserves re-apply ergonomics and existing remote-state design.

## Migration Plan

1. Land `schema.yaml` + packaging script updates on a feature branch.
2. Sanitize public examples to placeholders.
3. Add release/package workflow; cut a draft/prerelease with both zips.
4. Update quickstart/README download links to that release (or `latest`).
5. Existing Resource Manager stacks in the demo tenancy: no forced migration — re-upload zips on next change as today.
6. Rollback: revert docs/workflow; prior `.tf` without schema still uploadable.

## Open Questions

- Whether maintainers also want a `terraform/dist/` folder committed on release tags only (Git LFS / release-only) — default is **Release assets only**; revisit if users demand in-repo binaries.
- Exact GitHub Release naming (`sqlfw-console-terraform-vX` vs reuse app tags) — choose during apply; does not change specs.

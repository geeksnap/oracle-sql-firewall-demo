# OCI Terraform — SQL Firewall Demo (step-by-step deployment)

> **OCI Console only?** Use the one-page guide: **[OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md)** (Resource Manager, no local Terraform).

Two **correlated** Terraform stacks provision the full demo on OCI:

| Stack | Path | What it creates |
|-------|------|-----------------|
| **1 — Database** | `terraform/db/` | VCN, subnets, security lists, **Base DB VM** + PDB |
| **2 — Compute** | `terraform/compute/` | **Compute VM** with Aegis Vault + LuminaForge |

Compute reads DB outputs from `../db/terraform.tfstate`, bootstraps the schema (`scripts/oci-bootstrap-database.mjs`), and starts both apps via systemd.

**Compute bootstrap** (cloud-init) also installs Oracle Instant Client 19.31 (node-oracledb **thick mode** — required for OCI Base DB), opens **firewalld** ports 3000/3001, and sets `ORACLE_CLIENT_LIBDIR` on systemd units.

```text
Presenter browser
       │
       ▼
┌──────────────────────────────────────────┐
│  Compute VM (opc / odb_sec)              │
│  Aegis Vault :3000   LuminaForge :3001   │
└──────────────────┬───────────────────────┘
                   │ TCP 1521 (private VCN)
┌──────────────────▼───────────────────────┐
│  Base DB VM + PDB (SQLFWPDB1)            │
│  AEGIS_APP + luminaforge + SQL Firewall  │
└──────────────────────────────────────────┘
```

**Estimated time:** ~15 min prep + **60–90 min** DB provision + **10–20 min** compute bootstrap.

---

## Choose deployment method

| Method | Guide | State / correlation |
|--------|-------|---------------------|
| **OCI Console Terraform** (Resource Manager) | **[OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md)** | DB stack OCID → `db_stack_id` |
| **Local CLI** (`terraform apply` on laptop) | [Phase 0 onward below](#phase-0--oci-api-access-one-time) | `../db/terraform.tfstate` → `db_state_path` |

Both methods use the **same** `.tf` files. Only how DB outputs reach the compute stack differs.

---

## Deploy via OCI Console Terraform (Resource Manager)

> **Prefer a single page?** See **[OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md)**.

Use this when you run Terraform from **OCI Console** (Developer Services → **Resource Manager** → **Stacks**), not from your laptop.

### What changes vs local CLI

| Topic | Local CLI | OCI Console Terraform |
|-------|-----------|------------------------|
| State storage | `terraform/db/terraform.tfstate` on disk | Managed by Resource Manager (Object Storage) |
| Compute reads DB outputs | `db_state_path = "../db/terraform.tfstate"` | **`db_stack_id`** = OCID of DB stack |
| Provider auth | `~/.oci/config` on laptop | Automatic for stack jobs |
| Config upload | Folder on disk | **Zip per stack** (`.tf` files at zip root) |
| Variables | `terraform.tfvars` (gitignored) | Stack **Variables** tab in Console |

No `backend` block is required — Resource Manager manages state for each stack.

### RM-1 — Package stacks as zip files

From the repo:

```bash
cd terraform
chmod +x package-stacks.sh
./package-stacks.sh
```

Creates:

- `terraform/sqlfw-db-stack.zip` — upload first
- `terraform/sqlfw-compute-stack.zip` — upload after DB stack succeeds

Each zip contains only that stack’s `.tf` files (no `terraform.tfvars`, no local state).

### RM-2 — Create and apply DB stack

1. **OCI Console** → **Developer Services** → **Resource Manager** → **Stacks** → **Create stack**
2. **Zip file** → upload `sqlfw-db-stack.zip`
3. **Compartment** → same compartment as your demo resources
4. **Variables** — add (match `terraform/db/terraform.tfvars.example`):

| Variable | Example / notes |
|----------|-----------------|
| `region` | `ap-singapore-1` |
| `compartment_id` | `ocid1.compartment.oc1..…` |
| `ssh_public_key` | Full line from `~/.ssh/id_ed25519_sqlfw.pub` |
| `db_home_version` | **26ai** — minimum `23.26.0.0.0`; run `oci db version list` (see §1.4) and use latest `23.26+` in your region |
| `allow_ssh_cidr` | Your public IP `/32` (or `0.0.0.0/0`) — controls SSH + app ports 3000/3001; **Apply** after change |
| `pdb_name` | `SQLFWPDB1` (optional) |
| `project_prefix` | `sqlfw-demo` (optional) |

5. **Create** → **Plan** → review → **Apply**
6. Wait until job succeeds and Base DB lifecycle is **AVAILABLE** (**60–90+ min**).
7. **Stack details** → **Outputs** — note:
   - `db_connection_string`, `pdb_name`, `sys_password`, `app_db_password`
8. **Copy the DB stack OCID** (Stack information → OCID). You need it for the compute stack.

### RM-3 — Create and apply compute stack

1. **Create stack** → upload `sqlfw-compute-stack.zip`
2. **Variables**:

| Variable | Example / notes |
|----------|-----------------|
| `region` | Same as DB stack |
| `compartment_id` | Same as DB stack |
| `ssh_public_key` | Same public key as DB stack |
| `project_prefix` | Same as DB stack (`sqlfw-demo`) |
| **`db_stack_id`** | **OCID of DB stack from RM-2** (required for Console) |
| `github_repo_url` | `https://github.com/<org>/oracle-sql-firewall-demo.git` (public) or `https://<TOKEN>@github.com/...` (private) |
| `github_branch` | `main` |

> Push latest code to GitHub before deploy — especially `scripts/oci-bootstrap-database.mjs`, thick-mode `pool.ts`, and `serverExternalPackages: ["oracledb"]` in `next.config.ts`.

> **Do not** rely on `db_state_path` in Resource Manager — there is no `../db/terraform.tfstate` on the job runner. Set **`db_stack_id`** instead.

3. **Plan** → **Apply**
4. **Outputs** → `compute_public_ip`, `aegis_vault_url`, `luminaforge_url`
5. SSH to compute (if needed): `ssh -i ~/.ssh/id_ed25519_sqlfw opc@<compute_public_ip>`
6. Tail bootstrap: `sudo tail -f /var/log/sqlfw-install.log` until `[SUCCESS] Apps + DB schema ready`

Cloud-init installs Instant Client, Node 22, clones GitHub, builds apps, bootstraps DB, starts systemd (~10–20 min).

**Re-run bootstrap on existing VM:**

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw opc@<compute_public_ip> \
  'sudo bash -c "/usr/local/bin/sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1"'
```

### RM-4 — Demo policy (same as local)

1. Open Aegis `http://<compute_public_ip>:3000` → **Demo Control** → **Initialize default demo policy**
2. LuminaForge `:3001` → traffic → **Stop SQL capture** → **Generate Allow List**

### RM-5 — Teardown

Destroy **compute stack first**, then **DB stack** (each stack → **Destroy** job in Resource Manager).

### Resource Manager IAM

The identity running stack jobs needs the same permissions as local Terraform (manage database-family, instance-family, virtual-network-family in the compartment). Console often uses your user or a dedicated dynamic group — ensure policy allows Resource Manager to create resources in the target compartment.

---

## Phase 0 — OCI API access (one-time, local CLI only)

Skip Phase 0 if you use **[OCI Console Terraform](#deploy-via-oci-console-terraform-resource-manager)** only.

Terraform uses the OCI provider, which reads **`~/.oci/config`** by default.

### 0.1 Install tools

```bash
terraform version    # need >= 1.5
oci --version        # OCI CLI (optional but useful for verification)
```

Install if missing: [Terraform](https://developer.hashicorp.com/terraform/install), [OCI CLI](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm).

### 0.2 Create an API signing key (if you do not have one)

```bash
mkdir -p ~/.oci
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
chmod 600 ~/.oci/oci_api_key.pem
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem
```

### 0.3 Upload public key in OCI Console

1. **Profile** (top-right) → **My profile** → **API keys** → **Add API key**
2. Paste contents of `~/.oci/oci_api_key_public.pem`
3. Note the **configuration file preview** (user OCID, fingerprint, tenancy OCID, region)

### 0.4 Create `~/.oci/config`

```ini
[DEFAULT]
user=ocid1.user.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
fingerprint=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
tenancy=ocid1.tenancy.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
region=ap-singapore-1
key_file=~/.oci/oci_api_key.pem
```

Replace values from the Console preview. Set `region` to where you will deploy.

### 0.5 Verify API access

```bash
oci iam region list --output table
oci iam compartment list --compartment-id-in-subtree true --all \
  --query "data[*].{name:name, id:id}" --output table
```

If either command fails, fix `~/.oci/config` before continuing.

### 0.6 IAM policy (minimum)

Your user or group needs permission to create VCN, DB systems, and compute in the target compartment. Example policy statement (adjust group name and compartment):

```text
Allow group DemoAdmins to manage database-family in compartment sqlfw-demo
Allow group DemoAdmins to manage instance-family in compartment sqlfw-demo
Allow group DemoAdmins to manage virtual-network-family in compartment sqlfw-demo
```

---

## Phase 1 — Collect configuration values

Complete this **once**. Several values must be **identical in both stacks**.

### 1.1 Compartment OCID

**Console:** Identity & Security → **Compartments** → your compartment → **Copy OCID**

**CLI:**

```bash
oci iam compartment list \
  --compartment-id-in-subtree true \
  --all \
  --query "data[*].{name:name, id:id}" \
  --output table
```

Use the same OCID in:

- `terraform/db/terraform.tfvars` → `compartment_id`
- `terraform/compute/terraform.tfvars` → `compartment_id`

### 1.2 Region

Set **`region`** in **both** `terraform.tfvars` files (must match `~/.oci/config`, e.g. `ap-singapore-1`, `us-ashburn-1`).

### 1.3 SSH key pair

One key pair is used for **both** DBCS and Compute (`ssh_public_key`).

**Generate (skip if you already have a key):**

```bash
ssh-keygen -t ed25519 -C "sqlfw-oci-demo" \
  -f ~/.ssh/id_ed25519_sqlfw -N ""
```

**Copy the public key (full single line):**

```bash
cat ~/.ssh/id_ed25519_sqlfw.pub
```

Paste into **both** files:

| File | Variable |
|------|----------|
| `terraform/db/terraform.tfvars` | `ssh_public_key = "ssh-ed25519 AAAA... sqlfw-oci-demo"` |
| `terraform/compute/terraform.tfvars` | `ssh_public_key = "ssh-ed25519 AAAA... sqlfw-oci-demo"` |

**Private key** stays on your laptop — never commit it.

| After deploy | SSH user | Command |
|--------------|----------|---------|
| **Compute VM** | `opc` | `ssh -i ~/.ssh/id_ed25519_sqlfw opc@<compute_public_ip>` |
| **DBCS host** | `opc` | `ssh -i ~/.ssh/id_ed25519_sqlfw opc@<db_private_ip>` (VCN/VPN/bastion only) |

### 1.4 Oracle DB home version (26ai)

Oracle AI Database **26ai** requires DB home version **`23.26.0.0.0` or newer** (the product line starts at `23.26.0.0.0`; GA patches may show as `23.26.1.0.0`, etc.). Do **not** use `26.0.0.0.0` or pre-26ai `23.0.0.0`. The Terraform default is `23.26.0.0.0` — **always look up the latest 26ai version in your region** before apply and set `db_home_version` to that exact string.

**Step 1 — set compartment and region** (must match `terraform/db/terraform.tfvars`):

```bash
export COMPARTMENT_ID="ocid1.compartment.oc1..aaaaaaaaexample"
export OCI_REGION="ap-tokyo-1"    # same as region in terraform.tfvars / ~/.oci/config
export SUPPRESS_LABEL_WARNING=True   # optional — silences OCI API key label warning
```

**Step 2 — list all database versions** (confirms CLI auth and shows what your region offers):

```bash
oci db version list \
  --compartment-id "$COMPARTMENT_ID" \
  --region "$OCI_REGION" \
  --all \
  --query "data[*].version" \
  --output table
```

**Step 3 — filter 26ai versions** (`23.26.x.x.x`). Use **`jq`** (most reliable; works when JMESPath filters return empty):

```bash
oci db version list \
  --compartment-id "$COMPARTMENT_ID" \
  --region "$OCI_REGION" \
  --all \
  --output json \
| jq -r '.data[].version | select(test("^23\\.26\\."))' | sort -V
```

Pick the **last line** (highest `23.26+` version) for `db_home_version`.

**Step 3b — JMESPath alternative** (OCI CLI uses backticks for string literals, not single quotes):

```bash
oci db version list \
  --compartment-id "$COMPARTMENT_ID" \
  --region "$OCI_REGION" \
  --all \
  --query "data[?contains(version, \`23.26\`)].version" \
  --output table
```

**Step 4 — set in `terraform/db/terraform.tfvars`:**

```hcl
db_home_version = "23.26.0.0.0"   # replace with latest 23.26+ string from Step 3
```

The value must match **exactly** (including all dotted segments).

**If Step 3 returns nothing:** 26ai Base Database may not be available in that region yet — check **Oracle Base Database → Create** in the Console for a **23.26.x** version, try another region, or confirm `COMPARTMENT_ID` and `OCI_REGION` are set (an unset `$COMPARTMENT_ID` still runs but returns no rows).

**Console alternative:** **Oracle Base Database → Create** → **Database version** — pick the latest **23.26.x** entry.

### 1.5 Presenter network access (security lists)

Ingress for **SSH (22)**, **Aegis (3000)**, and **LuminaForge (3001)** on the compute subnet is controlled by **`allow_ssh_cidr`** in the **DB stack only** (`terraform/db/terraform.tfvars`).

```hcl
allow_ssh_cidr = "YOUR.PUBLIC.IP/32"   # recommended for demos
# allow_ssh_cidr = "0.0.0.0/0"        # open — Apply DB stack after change
```

> **Note:** `allow_ingress_cidr` in the compute stack example was removed — it is **not wired** in Terraform. Always set `allow_ssh_cidr` in the DB stack.

**firewalld on the compute VM** is a second layer: cloud-init opens TCP 3000 and 3001. If HTTP times out from your laptop but SSH works, check both OCI security list (`allow_ssh_cidr` + Apply) and `sudo firewall-cmd --list-ports` on the VM.

DB subnet allows **1521** from the compute subnet only (automatic).

### 1.6 GitHub clone URL (private repo)

Repo: `https://github.com/geeksnap/oracle-sql-firewall-demo` (private).

For cloud-init on the compute VM to clone a **private** repo, embed a read-only **Personal Access Token** in the URL:

1. GitHub → **Settings** → **Developer settings** → **Fine-grained tokens** (or classic PAT)
2. Scope: **Contents: Read** on `oracle-sql-firewall-demo`
3. Set in `terraform/compute/terraform.tfvars`:

```hcl
github_repo_url = "https://<GITHUB_TOKEN>@github.com/geeksnap/oracle-sql-firewall-demo.git"
github_branch   = "main"
```

Do **not** commit a real token. `terraform.tfvars` is gitignored.

### 1.7 Create `terraform.tfvars` files

```bash
cd terraform/db
cp terraform.tfvars.example terraform.tfvars

cd ../compute
cp terraform.tfvars.example terraform.tfvars
```

Edit **both** files. Minimum required:

```hcl
region         = "your-region"
compartment_id = "ocid1.compartment.oc1....."
ssh_public_key = "ssh-ed25519 AAAA... your-key"
project_prefix = "sqlfw-demo"    # must match in BOTH stacks if you change it
```

**DB only** (`terraform/db/terraform.tfvars`):

```hcl
db_home_version = "23.26.0.0.0"   # >= 23.26.0.0.0 — latest from §1.4 oci db version list
pdb_name        = "SQLFWPDB1"
allow_ssh_cidr  = "YOUR.IP/32"
```

**Compute only** (`terraform/compute/terraform.tfvars`):

```hcl
github_repo_url = "https://<TOKEN>@github.com/geeksnap/oracle-sql-firewall-demo.git"
github_branch   = "main"
db_state_path   = "../db/terraform.tfstate"
```

Passwords (`sys_password`, `app_db_password`) are **optional** — omit to auto-generate strong values (retrieve via `terraform output -raw` after apply).

### 1.8 Preparation checklist

- [ ] `~/.oci/config` works (`oci iam region list`)
- [ ] IAM policy allows DB + compute + VCN in compartment
- [ ] `compartment_id` in **db** and **compute** `terraform.tfvars`
- [ ] `region` identical in **both** files and matches OCI config
- [ ] `project_prefix` identical in **both** files (default `sqlfw-demo`)
- [ ] `ssh_public_key` in **both** files (same key)
- [ ] `db_home_version` looked up via `oci db version list` — **26ai** requires `23.26.0.0.0` or newer (see §1.4)
- [ ] `allow_ssh_cidr` set to presenter IP (or acceptable CIDR)
- [ ] GitHub PAT in `github_repo_url` if repo is private
- [ ] `terraform.tfvars` created from `.example` in **both** folders (not committed)

---

## Phase 2 — Deploy database stack

```bash
cd terraform/db
terraform init
terraform plan -out=tfplan
```

Review the plan: VCN `10.40.0.0/16`, DB subnet, compute subnet, `oci_database_db_system`.

```bash
terraform apply tfplan
# or: terraform apply
```

Type `yes` when prompted.

### 2.1 Wait for DB AVAILABLE

Base DB provisioning typically **60–90+ minutes**.

**Console:** Oracle Base Database → your system (`sqlfw-demo` prefix) → Lifecycle state **AVAILABLE**.

**CLI (poll):**

```bash
DB_ID=$(terraform output -raw db_system_id)
watch -n 60 "oci db system get --db-system-id $DB_ID --query 'data.\"lifecycle-state\"' --raw-output"
```

Do **not** start Phase 3 until state is **AVAILABLE**.

### 2.2 Capture DB outputs

```bash
cd terraform/db
terraform output db_private_ip
terraform output pdb_name
terraform output pdb_service_name
terraform output db_connection_string
terraform output -raw sys_password
terraform output -raw app_db_password
```

Save passwords securely (1Password, etc.). You need them for troubleshooting; apps receive them via cloud-init automatically.

### 2.3 Optional — verify listener from inside VCN

Only possible after compute exists, or from a bastion in the VCN. Skip until Phase 3 completes.

---

## Phase 3 — Deploy compute stack

Run **only after** Phase 2 shows **AVAILABLE**.

```bash
cd terraform/compute
terraform init
terraform plan -out=tfplan
```

Confirm the plan reads remote state from `../db/terraform.tfstate` and creates one `oci_core_instance`.

```bash
terraform apply tfplan
```

Compute VM creation is **~2–5 minutes**. App install + DB bootstrap runs via **cloud-init** (additional **10–20 minutes**).

### 3.1 What cloud-init does automatically

On first boot, `/usr/local/bin/sqlfw-install-apps.sh`:

1. Creates OS user **`odb_sec`**
2. Installs Node.js 22
3. Clones `github_repo_url` / `github_branch`
4. Waits up to **30 min** for DB listener on port **1521**
5. Runs `npm ci` + `npm run build` in `aegis-vault` and `luminaforge`
6. Writes `.env` files with DB connection + passwords from DB stack
7. Runs `node scripts/oci-bootstrap-database.mjs` (SYS → schema + SQL Firewall grants)
8. Enables and starts `aegis-vault.service` and `luminaforge.service`

### 3.2 Monitor bootstrap

```bash
cd terraform/compute
COMPUTE_IP=$(terraform output -raw compute_public_ip)
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo tail -f /var/log/sqlfw-install.log'
```

**Success line:** `[SUCCESS] Apps + DB schema ready`

**Verify services:**

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw opc@$COMPUTE_IP \
  'sudo systemctl is-active aegis-vault luminaforge'
```

Both should print `active`.

### 3.3 Smoke test from your laptop

```bash
curl -s -o /dev/null -w "Aegis %{http_code}\n" http://$COMPUTE_IP:3000
curl -s -o /dev/null -w "Lumina %{http_code}\n" http://$COMPUTE_IP:3001
```

Expect HTTP **200** or **307** (redirect). If **connection refused**, bootstrap may still be running — recheck the install log.

**Presenter URLs:**

```bash
terraform output aegis_vault_url
terraform output luminaforge_url
```

---

## Phase 4 — First-time demo policy (required once per fresh DB)

Schema bootstrap creates users and packages, but **SQL Firewall capture policy** is initialized from the UI:

1. Open **Aegis Vault** → `http://<compute_public_ip>:3000`
2. Go to **Demo Control**
3. Click **Initialize default demo policy** (LuminaForge **must** be running on `:3001`)
4. Open **LuminaForge** → `http://<compute_public_ip>:3001` — browse tabs to generate traffic
5. In Demo Control: **Stop SQL capture** → **Generate Allow List**

See **Phase 4** above and [`luminaforge/SPEC-luminaforge.md`](../luminaforge/SPEC-luminaforge.md) §6.1 for details.

---

## Phase 5 — Run the demo

| Action | Where |
|--------|--------|
| SOC dashboard / violations | Aegis `:3000` |
| Attack payloads / app tabs | LuminaForge `:3001` |
| Toggle firewall / capture | Aegis → Demo Control |
| Reset demo data (after Point 4) | `@luminaforge/scripts/reset-demo-data.sql` on PDB |

---

## Correlation between stacks

| DB stack output | Used by compute |
|-----------------|-----------------|
| `db_connection_string` | App `.env` + bootstrap script |
| `pdb_name` | `DB_CONTAINER` |
| `app_db_password` | `AEGIS_APP` + `luminaforge` passwords |
| `sys_password` | `oci-bootstrap-database.mjs` (SYS) |
| `compute_subnet_id` | Compute instance subnet |
| `vcn_id` | Shared VCN |

Compute stack reads DB outputs via:

- **Local CLI:** `terraform_remote_state` + `db_state_path` (default `../db/terraform.tfstate`)
- **OCI Console:** `oci_resourcemanager_stack_tf_state` + **`db_stack_id`** (DB stack OCID)

---

## Variables reference

### DB — `terraform/db/terraform.tfvars`

| Variable | Required | Purpose |
|----------|----------|---------|
| `compartment_id` | Yes | OCI compartment OCID |
| `region` | Yes | OCI region |
| `ssh_public_key` | Yes | SSH public key for DB host |
| `db_home_version` | Yes | **26ai** minimum `23.26.0.0.0` — use latest from `oci db version list` in your region (§1.4) |
| `allow_ssh_cidr` | Recommended | CIDR for SSH + app ports **3000/3001** on compute |
| `pdb_name` | No | PDB name (default `SQLFWPDB1`) |
| `project_prefix` | No | Resource name prefix (default `sqlfw-demo`) |
| `sys_password` | No | Omit to auto-generate |
| `app_db_password` | No | Omit to auto-generate |

### Compute — `terraform/compute/terraform.tfvars`

| Variable | Required | Purpose |
|----------|----------|---------|
| `compartment_id` | Yes | Same compartment as DB stack |
| `region` | Yes | Same region as DB stack |
| `ssh_public_key` | Yes | Same public key as DB stack |
| `db_state_path` | Local CLI only | Path to DB `terraform.tfstate` |
| `db_stack_id` | **Console Terraform** | OCID of DB Resource Manager stack |
| `github_repo_url` | Yes | Git clone URL (PAT if private) |
| `github_branch` | No | Branch to deploy (default `main`) |
| `project_prefix` | No | Must match DB stack |

---

## Teardown

Destroy **compute before DB** (compute depends on DB network outputs):

```bash
cd terraform/compute && terraform destroy
cd ../db && terraform destroy
```

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| `Error: 401-NotAuthenticated` | Fix `~/.oci/config`, API key, clock skew |
| `Error: 403-NotAuthorized` | Add IAM policy for compartment |
| DB apply slow | Normal; wait for **AVAILABLE** |
| `db_home_version` invalid | Re-run §1.4: list all versions (Step 2), then filter with `jq` (Step 3). Empty filter = wrong region, unset `COMPARTMENT_ID`, or 26ai not in region yet |
| Cloud-init failed | `sudo cat /var/log/sqlfw-install.log` on compute |
| DB listener timeout | Confirm DB **AVAILABLE**; security list allows 1521 from compute subnet |
| Bootstrap ORA errors | Stop apps; re-run bootstrap with env from `/root/sqlfw-bootstrap.env` (include `ORACLE_CLIENT_LIBDIR`) |
| **NJS-533** / ORA-12660 | OCI Base DB needs thick mode — Instant Client 19.31 (cloud-init installs it) |
| **NJS-045** | `serverExternalPackages: ["oracledb"]` in `next.config.ts` + rebuild on VM |
| Private GitHub clone fails | PAT in `github_repo_url`; or make repo public; update `/root/sqlfw-bootstrap.env` |
| `MODULE_NOT_FOUND` oci-bootstrap-database.mjs | Push script to GitHub `main`; re-run install script |
| Demo Control ORA-47605 | Re-run bootstrap or `@Oracle_DB_Demo_Control_Grant.sql` as SYS |
| Bootstrap ORA-47630 | No allow-list row for `AEGIS_APP` yet on fresh PDB — update `Oracle_DB_Demo_Control_Grant.sql` (ignore `-47630` in `configure_aegis_soc`) and re-run bootstrap |
| Bootstrap ORA-01920 | Users already exist from a partial run — update `oci-bootstrap-database.mjs` and re-run bootstrap |
| SSH permission denied | `ssh -i ~/.ssh/id_ed25519_sqlfw opc@<ip>` |
| Apps up but HTTP **000** / timeout | `allow_ssh_cidr` + **Apply** DB stack; firewalld 3000/3001 on VM |
| `terraform_remote_state` error (local) | Apply DB stack first; verify `db_state_path` |
| Compute plan fails in Resource Manager | Set **`db_stack_id`** to DB stack OCID; do not use `db_state_path` alone |
| Log permission denied re-running install | Use `sudo bash -c '.../sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1'` |

**Re-run bootstrap manually on compute:**

```bash
sudo systemctl stop aegis-vault luminaforge   # if ORA-01940 (user connected)
sudo bash -c 'source /root/sqlfw-bootstrap.env && cd /home/odb_sec/apps/oracle-sql-firewall-demo && \
  sudo -u odb_sec env ORACLE_CLIENT_LIBDIR="$ORACLE_CLIENT_LIBDIR" LD_LIBRARY_PATH="$LD_LIBRARY_PATH" \
  DB_CONNECT_STRING="$DB_CONNECT_STRING" DB_SYS_PASSWORD="$DB_SYS_PASSWORD" \
  DB_PDB_NAME="$DB_PDB_NAME" APP_DB_PASSWORD="$APP_DB_PASSWORD" \
  node scripts/oci-bootstrap-database.mjs'
sudo systemctl start aegis-vault luminaforge
```

**Re-run full install (clone + build + bootstrap):**

```bash
sudo bash -c '/usr/local/bin/sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1'
```

---

## Related docs

- **[OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md)** — one-page Console-only deploy
- **[README.md](../README.md)** — local start/stop (`start.sh` / `stop.sh`)
- **§1.6 GitHub clone URL** — private repo PAT bootstrap
- [`luminaforge/SPEC-luminaforge.md`](../luminaforge/SPEC-luminaforge.md) §6.1 — SQL Firewall Demo Control / allow-list workflow
- `scripts/oci-bootstrap-database.mjs` — automated DB schema

---

## Appendix — Key connection information (after deploy)

### Quick “print everything” commands

```bash
# --- Database stack ---
cd terraform/db
echo "=== DATABASE ==="
terraform output -raw region
terraform output -raw compartment_id
terraform output -raw db_private_ip
terraform output -raw db_hostname
terraform output -raw pdb_name
terraform output -raw pdb_service_name
terraform output -raw db_connection_string
echo "SYS password:      $(terraform output -raw sys_password)"
echo "App DB password:   $(terraform output -raw app_db_password)"

# --- Compute stack ---
cd ../compute
echo "=== COMPUTE / APPS ==="
terraform output -raw compute_public_ip
terraform output -raw aegis_vault_url
terraform output -raw luminaforge_url
terraform output -raw ssh_command
terraform output -raw db_connection_string
```

---

### SSH access

| Target | User | Port | Command |
|--------|------|------|---------|
| **Compute VM** (apps) | `opc` | 22 | `ssh -i ~/.ssh/id_ed25519_sqlfw opc@<compute_public_ip>` |
| **DBCS host** | `opc` | 22 | `ssh -i ~/.ssh/id_ed25519_sqlfw opc@<db_private_ip>` |
| **App processes** (on compute) | `odb_sec` | — | `sudo su - odb_sec` after SSH as `opc` |

**Bootstrap / service logs on compute:**

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw opc@<compute_public_ip> \
  'sudo tail -100 /var/log/sqlfw-install.log'
ssh -i ~/.ssh/id_ed25519_sqlfw opc@<compute_public_ip> \
  'sudo systemctl status aegis-vault luminaforge'
ssh -i ~/.ssh/id_ed25519_sqlfw opc@<compute_public_ip> \
  'sudo journalctl -u aegis-vault -n 50 --no-pager'
```

---

### SQL*Net / database connection

| Field | Value (from Terraform) | Terraform output |
|-------|------------------------|------------------|
| **Host (private)** | `<db_private_ip>` | `db_private_ip` |
| **Port** | `1521` | (fixed) |
| **PDB name** | `SQLFWPDB1` (default) | `pdb_name` |
| **Service name** | `sqlfwpdb1.dbsnet.sqlfwvcn.oraclevcn.com` | `pdb_service_name` |
| **Easy Connect** | `host:1521/service` | `db_connection_string` |

**Easy Connect string (apps use this):**

```text
<db_private_ip>:1521/<pdb_service_name>
```

Example:

```text
10.40.1.12:1521/sqlfwpdb1.dbsnet.sqlfwvcn.oraclevcn.com
```

**Database users (created by bootstrap):**

| User | Purpose | Password |
|------|---------|----------|
| `SYS` | Admin / bootstrap | `terraform output -raw sys_password` (db stack) |
| `AEGIS_APP` | Aegis Vault SOC + Demo Control | `terraform output -raw app_db_password` |
| `luminaforge` | LuminaForge app | same as `AEGIS_APP` |

**sqlplus from compute VM** (DB reachable on private network):

```bash
sqlplus 'AEGIS_APP/<app_password>@<db_private_ip>:1521/<pdb_service_name>'
sqlplus "sys/<sys_password>@<db_private_ip>:1521/<pdb_service_name> as sysdba"
```

**SQL Developer / VS Code** (from VPN or bastion with VCN access):

| Field | Value |
|-------|--------|
| Connection type | Basic |
| Hostname | `<db_private_ip>` |
| Port | `1521` |
| Service name | `<pdb_service_name>` |
| Username | `AEGIS_APP`, `luminaforge`, or `sys` (SYSDBA role) |

---

### Application access (presenter URLs)

| Application | Port | URL | Notes |
|-------------|------|-----|--------|
| **Aegis Vault** (SOC dashboard) | **3000** | `http://<compute_public_ip>:3000` | `aegis_vault_url` |
| **LuminaForge** (direct / bypass WAF) | **3001** | `http://<compute_public_ip>:3001` | `luminaforge_url` |
| **LuminaForge via WAF** | **80** | `http://<lb_public_ip>/` | Load Balancer `sqlfw-demo-lb` + WAF `demo-wap-firewall` |
| **Compute :80 shortcut** | **80** | `http://<compute_public_ip>/` | Redirects to LB (after `scripts/setup-waf-port80-redirect.sh`) |

**WAF path:** Internet → **LB :80** (`sqlfw-demo-waf-policy`) → backend **`<compute_private_ip>:3001`**. Use the LB reserved public IP, not the compute IP on port 80 (LuminaForge does not listen on :80).

Backend set must register the compute **private** IP (e.g. `10.40.0.x:3001`), not the public IP. Security list must allow **`compute_subnet_cidr` → TCP 3001** for LB health checks (in `terraform/db/main.tf`).

```bash
# One-time on compute VM (set WAF_LB_URL from LB → Reserved public IP)
WAF_LB_URL=http://<lb_public_ip> sudo -E bash scripts/setup-waf-port80-redirect.sh
```

**Internal (on compute VM):**

| Service | Used by |
|---------|---------|
| Aegis `:3000` | Presenter browser via public IP |
| LuminaForge `:3001` | Presenter + Aegis init (`LUMINAFORGE_BASE_URL=http://127.0.0.1:3001`) |

---

### Network ports summary

| Port | Protocol | Source → Destination | Purpose |
|------|----------|----------------------|---------|
| **22** | TCP | `allow_ssh_cidr` → Compute / DB | SSH admin |
| **1521** | TCP | Compute subnet → DB subnet | Oracle listener |
| **3000** | TCP | `allow_ssh_cidr` → Compute | Aegis Vault |
| **3001** | TCP | `allow_ssh_cidr` → Compute | LuminaForge (direct bypass) |
| **3001** | TCP | `compute_subnet_cidr` → Compute | Load Balancer → LuminaForge backend |
| **80** | TCP | `0.0.0.0/0` → Compute subnet | LB listener + optional VM redirect |

---

### Environment on compute VM (`odb_sec`)

```text
/home/odb_sec/apps/oracle-sql-firewall-demo/aegis-vault/.env
/home/odb_sec/apps/oracle-sql-firewall-demo/luminaforge/.env
```

| Variable | Aegis | LuminaForge |
|----------|-------|-------------|
| `DB_USER` | `AEGIS_APP` | `luminaforge` |
| `DB_PASSWORD` | from `app_db_password` | same |
| `DB_CONNECTION_STRING` | from `db_connection_string` | same |
| `DB_CONTAINER` | from `pdb_name` | same |
| `PORT` | `3000` | `3001` |
| `LUMINAFORGE_BASE_URL` | `http://127.0.0.1:3001` | — |

**systemd** also sets `ORACLE_CLIENT_LIBDIR=/usr/lib/oracle/19.31/client64/lib` and `LD_LIBRARY_PATH` for thick-mode oracledb.

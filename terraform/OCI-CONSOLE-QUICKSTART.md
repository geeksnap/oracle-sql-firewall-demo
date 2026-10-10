# OCI Console Quickstart — SQL Firewall Demo

**One page.** Deploy entirely from **OCI Console → Developer Services → Resource Manager**. No local `terraform apply`.

| Time | ~15 min prep + **60–90 min** DB Apply + **5–15 min** compute Apply (VM + LB + WAF) + **10–20 min** cloud-init |
|------|-------------------------------------------------------------------------------------------|

```text
Browser → Compute VM (:3000 Aegis, :3001 LuminaForge) → Base DB 26ai (PDB)
         └── LuminaForge WAF path: Internet → LB :80 (WAF) → compute :3001
         └── private VCN (created by DB stack — do not pre-create)
```

New tenancy or another compartment (login, SSH key, numbered steps): [`OCI-QUICK-DEPLOYMENT.md`](OCI-QUICK-DEPLOYMENT.md). Full reference: [`README.md`](../README.md) · Start/stop apps + DB: [`README.md`](../README.md#startstop) · Local CLI: [`README.md#phase-0--oci-api-access-one-time`](README.md) · Zip downloads: [`DOWNLOAD.md`](DOWNLOAD.md)

### Console path at a glance

| Order | What | Where |
|------:|------|--------|
| 0 | Prep: region, compartment OCID, SSH **public** key, `db_home_version` (26.x), your `/32` | Console + laptop (no Terraform CLI) |
| 1 | Download **`sqlfw-db-stack.zip`** then **`sqlfw-compute-stack.zip`** | [Release `orm-stacks-20261010`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/tag/orm-stacks-20261010) |
| 2 | **Create stack** → upload DB zip → fill schema Variables → **Plan → Apply** (~60–90 min) | Resource Manager |
| 2b | Confirm public GitHub URL (default) or PAT for private | Before compute Apply |
| 2c | Configure DB sqlnet for Thin Mode (Bastion **or** after compute via ProxyJump) | DB host as `opc` |
| 3 | Copy DB **stack OCID** → Create compute stack → set **`db_stack_id`** → Plan → Apply | Resource Manager |
| 4 | Wait for cloud-init `[SUCCESS]` → open Outputs URLs → **Initialize default demo policy** | Browser + optional SSH |

**Do not** pre-create a VCN with the VCN Wizard. **Do not** reverse DB/compute order. Secrets go only in Resource Manager **Variables** (never in the zip).

---

## Networking — VCN is included (do not use VCN Wizard)

The **DB stack creates the entire network** automatically. You do **not** need a separate VCN step.

| Resource | Created by DB stack | Default CIDR |
|----------|---------------------|--------------|
| VCN | `sqlfw-demo-vcn` | `10.40.0.0/16` |
| Compute subnet (public IP) | `sqlfw-demo-compute-subnet` | `10.40.0.0/24` |
| DB subnet (private) | `sqlfw-demo-db-subnet` | `10.40.1.0/24` |
| Internet gateway + route tables | yes | — |
| **Service gateway** | yes — DB subnet → Object Storage (required for Base DB) | — |
| Security lists | yes — **1521** (compute→DB), **22/3000/3001/80** (`allow_ssh_cidr` + LB) | — |
| **ufw on compute VM** | cloud-init opens **3000/3001** (+ **80** when WAF enabled) | — |
| **Load Balancer + WAF** | **compute stack** (`enable_waf = true`, default) — `sqlfw-demo-lb`, `demo-waf-firewall` | — |

**Do not** use **Networking → Virtual Cloud Networks → VCN Wizard** before deploying. A wizard VCN will not be used by this Terraform and will cause confusion (wrong subnets, missing rules for ports 3000/3001 and 1521).

**Only if** `10.40.0.0/16` overlaps an existing VCN in the same compartment, change these optional DB stack variables before Apply:

```hcl
vcn_cidr             = "10.50.0.0/16"
compute_subnet_cidr  = "10.50.0.0/24"
db_subnet_cidr       = "10.50.1.0/24"
```

Otherwise leave defaults — no networking prep required.

### Two-layer firewall (ports 3000 / 3001)

Browser access to the apps requires **both** layers to allow your IP:

| Layer | Where | What to set |
|-------|--------|-------------|
| **OCI security list** | DB stack variable `allow_ssh_cidr` | Your public IP `/32`, or `0.0.0.0/0` for open demos |
| **ufw on VM** | cloud-init (automatic on new VMs) | Opens TCP 3000, 3001, and **80** (when `enable_waf = true`) |

Changing `allow_ssh_cidr` in the Console **Variables** tab does nothing until you run **Plan → Apply** on the **DB stack**.  
If HTTP returns `000` or connection refused but SSH works, check ufw on the VM:

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo ufw status'
# expect: 3000/tcp ALLOW  3001/tcp ALLOW  (and 80/tcp when WAF enabled)
```

---

## What compute Terraform + cloud-init provision

**During Step 3 Apply** (before cloud-init finishes), Terraform creates when `enable_waf = true` (default):

- Reserved public IP + flexible load balancer **`sqlfw-demo-lb`** (listener **:80**)
- Backend set → compute reserved private IP **`:3001`**
- WAF policy **`sqlfw-demo-waf-policy`** (SQLi JMESPath + OWASP rules)
- WAF attachment **`demo-waf-firewall`**
- Compute VM with `WAF_LB_URL` baked into `/root/sqlfw-bootstrap.env`

Set `enable_waf = false` in compute stack Variables to skip LB/WAF (direct `:3001` only).

**After Apply succeeds**, cloud-init on the VM runs (~**10–20 min**):

1. Opens **ufw** ports 3000 / 3001 (+ **80** when WAF enabled)
2. Installs **Node.js 22** via NodeSource + `apt`, clones GitHub, waits for DB listener on port 1521
3. Runs `npm ci` + `npm run build` for both apps
4. Runs `scripts/oci-bootstrap-database.mjs` (schema, users, demo packages) — **node-oracledb Thin Mode**, no Instant Client required
5. Starts **systemd** services `aegis-vault` (:3000) and `luminaforge` (:3001)
6. When WAF enabled: installs **nginx** on compute **:80** → redirects to **`luminaforge_waf_url`**

**Repo on GitHub must include** (push to `main` before deploy):

- `scripts/oci-bootstrap-database.mjs`
- `serverExternalPackages: ["oracledb"]` in both `next.config.ts` files

---

## Before you start

| Need | Action |
|------|--------|
| **Console region** | Select target region (top-right) — must match `region` in **both** stacks (same value) |
| OCI compartment OCID | **Identity → Compartments** → Copy OCID (`compartment_id`; schema also offers a compartment picker) |
| SSH public key | On your laptop: `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_sqlfw -N ""` → paste `id_ed25519_sqlfw.pub` into Variables (not OCI CLI) |
| 26ai DB version | Latest **`26.x.x.x.x`** in your region — [Console check](#check-26ai-db-home-version-before-db-stack) preferred; CLI optional |
| Your public IP | `allow_ssh_cidr = "x.x.x.x/32"` on **DB stack** — must **Apply** after change (opens SSH + **3000/3001**) |
| **GitHub repo** | Public default URL needs no PAT. Forks/private: set `github_repo_url` (see Step 2b). Zip has **no** app code — VM clones GitHub |
| IAM — resources | `manage database-family`, `instance-family`, `virtual-network-family`, `load-balancers`, `waf-family` in target compartment |
| IAM — Resource Manager | `manage orm-stacks`, `manage orm-jobs` (or `manage stacks` / `manage jobs`) in compartment where stacks live |
| IAM — Bastion (optional) | Needed only for [Step 2c Option A](#option-a--oci-bastion-before-compute-exists) before the compute VM exists |
| **VCN / networking** | **Nothing to create manually** — DB stack provisions VCN + subnets (see [Networking](#networking--vcn-is-included-do-not-use-vcn-wizard)) |

---

## Check 26ai DB home version (before DB stack)

26ai versions appear as **`26.x.x.x.x`** (e.g. `26.0.0.0.0`). Use the latest `26.x` string available in **your** Console region.

### Console (preferred — no OCI CLI)

1. Open **Oracle Base Database** → **Create DB system** (or Create database).
2. Note the latest **26.x** **Database version** / DB home version offered in the wizard.
3. Cancel the create wizard if you only needed the version string.
4. Enter that exact string as **`db_home_version`** in the DB stack Variables (schema default is `26.0.0.0.0`).

If the wizard has no **26.x** option, pick another region or wait until Base Database 26ai is available there.

### Optional — OCI CLI

Only if you already use the OCI CLI locally:

```bash
export COMPARTMENT_ID="ocid1.compartment.oc1..aaaaaaaaEXAMPLE_REPLACE_WITH_YOUR_COMPARTMENT_OCID"
export OCI_REGION="ap-singapore-1"   # MUST match Console region + both stack region variables
export SUPPRESS_LABEL_WARNING=True   # optional

# 1) List ALL versions
oci db version list \
  --compartment-id "$COMPARTMENT_ID" \
  --region "$OCI_REGION" \
  --all \
  --query "data[*].version" \
  --output table

# 2) Filter 26ai (26.x)
oci db version list \
  --compartment-id "$COMPARTMENT_ID" \
  --region "$OCI_REGION" \
  --all \
  --output json \
| jq -r '.data[].version | select(test("^26\\."))' | sort -V
```

Use the **highest** `26.x` string for **`db_home_version`**. Empty filter with a catalog that stops at `21.0.0.0` means 26ai is not offered for Base Database in that region.

---

## Step 1 — Get stack zip files (download preferred)

**Preferred — download published Release assets** (no local Terraform / packaging):

1. Open release **[`orm-stacks-20261010`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/tag/orm-stacks-20261010)** (or [Latest](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/latest) when it points at ORM stack assets).
2. Download both zips (also listed in [DOWNLOAD.md](DOWNLOAD.md)):

| Zip | Order | Direct URL |
|-----|-------|------------|
| [`sqlfw-db-stack.zip`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/download/orm-stacks-20261010/sqlfw-db-stack.zip) | Upload **first** | DB + VCN |
| [`sqlfw-compute-stack.zip`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/download/orm-stacks-20261010/sqlfw-compute-stack.zip) | Upload **second** | Compute + WAF/LB |

Each zip has `.tf` files + `schema.yaml` at the **root** (no `.terraform/`, no real `terraform.tfvars`, no secrets). Schema drives the Console **Configure variables** wizard (grouped Required / Passwords / Optional).

**Alternate — build from a clone** (maintainers or if Release assets are missing):

```bash
cd terraform
chmod +x package-stacks.sh   # first time only
./package-stacks.sh
```

Produces gitignored zips in `terraform/` (`sqlfw-*-stack.zip`). CI: **Actions → Package OCI Resource Manager stacks**.

---

## Step 2 — DB stack (Resource Manager)

**Console:** **Developer Services → Resource Manager → Stacks → Create stack**

| Wizard step | Choice |
|-------------|--------|
| Configuration source | **My configuration** → **.Zip file** → `sqlfw-db-stack.zip` |
| Stack compartment | Compartment to store the stack object (often same as demo compartment) |
| Terraform version | **1.5+** (match `required_version` in zip) |
| Stack name | e.g. `sqlfw-db` |

**Variables** — schema groups **Required**, **Passwords (sensitive)**, **Optional**. Names must match `schema.yaml` / `variables.tf` exactly:

```hcl
# Required (same region string in DB + compute stacks and Console top-right)
region          = "ap-singapore-1"              # example — use YOUR Console region
compartment_id  = "ocid1.compartment.oc1..aaaaaaaaEXAMPLE_REPLACE_WITH_YOUR_COMPARTMENT_OCID"
ssh_public_key  = "ssh-ed25519 AAAA... sqlfw"   # full single-line .pub
db_home_version = "26.0.0.0.0"                  # latest 26.x from Console Base Database create wizard
allow_ssh_cidr  = "YOUR.PUBLIC.IP/32"           # or "0.0.0.0/0" for open demos — Apply after change

# Optional (schema defaults are fine for most demos)
pdb_name        = "SQLFWPDB1"
project_prefix  = "sqlfw-demo"
# vcn_cidr / compute_subnet_cidr / db_subnet_cidr — only if 10.40.0.0/16 overlaps

# Passwords (sensitive) — set in Variables UI; leave blank only for demo-only Terraform defaults
# sys_password    = "CHANGE_ME_Adm12_Xy"   (no substring 'sys' or 'Oracle')
# app_db_password = "CHANGE_ME_AppDb34_Gh"
```

**Passwords:** Enter only in Resource Manager **Variables**. **Do not** bake real passwords into the zip. Do **not** set `sys_password` to `pdb_name`.

| Variable | Guidance |
|----------|----------|
| `sys_password` | OCI-compliant SYS password; must **not** contain **`Oracle`** or **`sys`** |
| `app_db_password` | App DB password; must **not** contain **`Oracle`** |

**Run jobs:** **Plan** → review → **Apply**. The plan should show a **new VCN**, two subnets, security lists, and a Base DB system. The Apply job blocks until Base DB provisioning finishes (~**60–90 min**). Wait for job status **Succeeded**.

**Optional cross-check:** **Oracle Base Database** → DB system lifecycle **AVAILABLE**.

**Stack → Outputs** (save for troubleshooting; schema also surfaces these):

| Output | Notes |
|--------|--------|
| `db_connection_string` | Easy Connect for apps |
| `pdb_name` | e.g. `SQLFWPDB1` |
| `sys_password` | Sensitive — show in Console |
| `app_db_password` | Sensitive — show in Console |
| `vcn_id` / `compute_subnet_id` | Handy for Bastion (Step 2c) |

**Copy Stack OCID** (Stack details → Stack information) — required for Step 3 as `db_stack_id`.

---

## Step 2b — GitHub repo URL (public or private)

Do this **before** compute Apply. Cloud-init runs `git clone` as user `odb_sec` on the compute VM.

### Public repo (no token — simplest)

The published stacks default to the public upstream URL. For the canonical demo:

```hcl
github_repo_url = "https://github.com/geeksnap/oracle-sql-firewall-demo.git"
github_branch   = "main"
```

No PAT required. Skip the rest of this section unless you deploy from a **private** fork.

### Private repo (PAT required)

A **private** repo needs a **Personal Access Token (PAT)** embedded in `github_repo_url`. Enter it only in Resource Manager Variables — never commit it.

### Create a fine-grained token (recommended)

1. Log in to **GitHub** → **Profile photo** → **Settings**
2. **Developer settings** (left sidebar, bottom) → **Personal access tokens** → **Fine-grained tokens**
3. **Generate new token**
4. **Token name:** e.g. `oci-sqlfw-demo-read`
5. **Expiration:** 90 days (or your policy)
6. **Resource owner:** your account / org
7. **Repository access:** **Only select repositories** → choose your fork / private repo
8. **Permissions → Repository permissions:**
   - **Contents:** **Read-only**
   - (Leave everything else **No access**)
9. **Generate token** → copy the token **once** (starts with `github_pat_...`)

### Set in compute stack Variables

Replace `<TOKEN>` with the copied value (no spaces):

```hcl
github_repo_url = "https://github_pat_XXXXXXXXXXXXXXXXXXXX@github.com/YOUR_ORG/oracle-sql-firewall-demo.git"
```

**Alternative format** (also works):

```hcl
github_repo_url = "https://YOUR_ORG:github_pat_XXXXXXXXXXXXXXXXXXXX@github.com/YOUR_ORG/oracle-sql-firewall-demo.git"
```

Mark **`github_repo_url` as sensitive** in Resource Manager if the UI offers it. **Never commit** the token to git.

### Classic token (fallback)

1. **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Generate new token (classic)** → note e.g. `oci-sqlfw-demo`
3. Scope: **`repo`** (Full control of private repositories) — or minimum read-only scopes your org allows
4. Generate and copy (starts with `ghp_...`)

```hcl
github_repo_url = "https://ghp_XXXXXXXXXXXXXXXXXXXX@github.com/YOUR_ORG/oracle-sql-firewall-demo.git"
```

### After updating the token or making the repo public

Saving a variable in Resource Manager does **not** re-run cloud-init. Either:

**A — Re-run bootstrap on existing VM** (faster):

```bash
COMPUTE_IP=<compute_public_ip>

# Update clone URL on VM if you changed github_repo_url
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo sed -i "s|^export GITHUB_REPO=.*|export GITHUB_REPO=https://github.com/geeksnap/oracle-sql-firewall-demo.git|" /root/sqlfw-bootstrap.env'

# Re-run install (must use bash -c so log redirection runs as root)
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo bash -c "/usr/local/bin/sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1"'

ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo tail -f /var/log/sqlfw-install.log'
```

**B — Recreate compute instance:** update compute stack Variables → **Plan → Apply** (Terraform replaces the VM; cloud-init runs fresh).

---

## Step 2c — Configure DB for thin-mode clients (required)

OCI Base Database may negotiate **Native Network Encryption (NNE)** on TCP port 1521. `node-oracledb` **Thin Mode** does not support NNE — connections fail with **NJS-533 / ORA-12660** unless the DB server accepts unencrypted TCP.

Run this **once** on the DB VM. Preferred: **before** compute bootstrap finishes (Option A). If you skip Bastion, Apply compute first, then Option B, then re-run the install script.

The DB host has **no public IP**.

### Option A — OCI Bastion (before compute exists)

1. **Identity & Security → Bastions** → create a bastion in the demo compartment, attached to the DB stack **VCN** / suitable subnet
2. Create a **managed SSH** or **port-forwarding** session to the DB private IP (or FQDN), port **22**
3. SSH as `opc` (DB stack SSH key) and run:

```bash
curl -fsSL https://raw.githubusercontent.com/geeksnap/oracle-sql-firewall-demo/main/scripts/configure-db-sqlnet-for-thin-mode.sh | sudo bash
```

### Option B — ProxyJump through compute (after Step 3 Apply)

From your laptop (same SSH key as DB + compute). If bootstrap already failed with NJS-533 / ORA-12660, run this, then re-run `sqlfw-install-apps.sh` on the compute VM.

```bash
export COMPUTE_IP="<compute_public_ip from Step 3 outputs>"

ssh -A -i ~/.ssh/id_ed25519_sqlfw ubuntu@"$COMPUTE_IP" \
  'ssh -o StrictHostKeyChecking=no opc@sqlfwdb.dbsnet.sqlfwvcn.oraclevcn.com \
    "curl -fsSL https://raw.githubusercontent.com/geeksnap/oracle-sql-firewall-demo/main/scripts/configure-db-sqlnet-for-thin-mode.sh | sudo bash"'
```

(If you changed `project_prefix` / hostnames, use the DB host FQDN from DB stack output `db_host_fqdn` / `db_private_ip`.)

Or copy the script from the repo and run it manually on the DB host as `opc`.

Expected output: `[SUCCESS] sqlnet.ora updated — thin-mode clients can connect on TCP :1521`

---

## Step 3 — Compute stack (Resource Manager)

**Prerequisite:** Step 2 Apply job **Succeeded** (DB stack state must exist). Complete Step 2b (GitHub URL). Prefer Step 2c Option A before waiting on cloud-init.

**Create stack** → upload `sqlfw-compute-stack.zip` (same wizard choices as Step 2; name e.g. `sqlfw-compute`).

**Variables** — schema groups **Required (Console)**, **GitHub source**, **WAF / Load Balancer**, **Optional overrides**. **`db_stack_id` is required** (without it Plan fails looking for local state):

```hcl
region          = "ap-singapore-1"              # MUST match DB stack + Console region (same string)
compartment_id  = "ocid1.compartment.oc1..aaaaaaaaEXAMPLE_REPLACE_WITH_YOUR_COMPARTMENT_OCID"
ssh_public_key  = "ssh-ed25519 AAAA... sqlfw"   # same key as DB stack
project_prefix  = "sqlfw-demo"                  # same as DB stack
db_stack_id     = "ocid1.ormstack.oc1....."     # REQUIRED — DB stack OCID from Step 2
github_repo_url = "https://github.com/geeksnap/oracle-sql-firewall-demo.git"   # public default
# github_repo_url = "https://<TOKEN>@github.com/YOUR_ORG/oracle-sql-firewall-demo.git"  # private only
github_branch   = "main"
enable_waf      = true    # default — LB + WAF + compute :80 redirect; set false for :3001-only demos
# load_balancer_bandwidth_mbps = 10   # optional schema default
# override_* passwords / connection string — leave blank to use DB stack remote state
```

**Terraform creates on Apply** (in addition to the compute VM):

| Resource | Default name |
|----------|----------------|
| Load Balancer | `sqlfw-demo-lb` |
| WAF policy | `sqlfw-demo-waf-policy` |
| WAF attachment | `demo-waf-firewall` |

> **`db_stack_id` is mandatory** in Resource Manager. Copy from **DB stack → Stack information → OCID** (starts with `ocid1.ormstack.`).  
> Do **not** rely on `db_state_path` — the job runner has no `../db/terraform.tfstate`.

**Run:** Plan → Apply (**~5–15 min** — VM + reserved IPs + load balancer + WAF policy/attachment).

> **Apply Succeeded ≠ apps ready.** Terraform provisions infrastructure; **cloud-init** then installs Node, clones GitHub, bootstraps the DB, starts systemd, and configures the WAF redirect (**10–20 min** more).

**Stack → Outputs** — copy these from the Console (schema titles match):

| Output | Use |
|--------|-----|
| `compute_public_ip` | SSH / troubleshooting |
| `aegis_vault_url` | Browser → Aegis Vault `:3000` |
| `luminaforge_url` | Browser → LuminaForge direct `:3001` |
| `luminaforge_waf_url` | Presenter WAF entry (`:80`) when `enable_waf = true` |

Your URLs use **your** stack IPs — not any example IPs from an existing public demo.

**Wait for bootstrap** (required before Step 4). **Console-first:** open `aegis_vault_url` / `luminaforge_url` in a browser every few minutes until both load (**200** / redirect). Connection refused usually means cloud-init is still running (~10–20 min).

**Optional SSH** (laptop) to watch the log:

```bash
COMPUTE_IP=<from terraform output compute_public_ip>
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo tail -f /var/log/sqlfw-install.log'
```

Success line: `[SUCCESS] Apps + DB schema ready`

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo systemctl is-active aegis-vault luminaforge'
```

Both must print `active`.

**Optional curl smoke test** (after bootstrap):

```bash
curl -s -o /dev/null -w "Aegis %{http_code}\n"  http://$COMPUTE_IP:3000
curl -s -o /dev/null -w "Lumina %{http_code}\n" http://$COMPUTE_IP:3001
```

Expect **200** or **307**. If install log shows **NJS-533 / ORA-12660**, finish [Step 2c](#step-2c--configure-db-for-thin-mode-clients-required) then re-run `sqlfw-install-apps.sh`.

---

## Step 4 — Initialize demo (once per fresh DB)

**Prerequisite:** Step 3 bootstrap complete (apps respond in the browser, or `[SUCCESS]` + both services `active`).

1. Open **Aegis Vault** (`aegis_vault_url` from compute Outputs) → **Demo Control**
2. **Initialize default demo policy** (LuminaForge must be running on `:3001`)
3. Open **LuminaForge** (`luminaforge_url`) — browse tabs to generate traffic
4. Back in Demo Control: **Stop SQL capture** → **Generate Allow List**

Details: [`terraform/README.md`](README.md#phase-4--first-time-demo-policy-required-once-per-fresh-db) and [`luminaforge/SPEC-luminaforge.md`](../luminaforge/SPEC-luminaforge.md) §6.1

---

## Step 5 — Login & verify (after Terraform succeeds)

Use this checklist after **DB stack** Apply succeeds, then again after **compute stack** + bootstrap.

### 5A — DB stack only (Terraform job Succeeded)

**Console checks**

1. **Resource Manager** → DB stack → **Outputs** — copy:
   - `db_connection_string`
   - `pdb_name` (e.g. `SQLFWPDB1`)
   - `sys_password`, `app_db_password` (click **Show** on sensitive outputs)
2. **Oracle Base Database** → DB system `sqlfw-demo` (or your `project_prefix`) → **Lifecycle state = AVAILABLE**
3. **Networking → VCN** `sqlfw-demo-vcn` → subnets `sqlfw-demo-db-subnet`, `sqlfw-demo-compute-subnet` exist
4. **Service gateway** attached to the VCN

**Schema is not loaded yet** — that runs on the compute VM (Step 3 cloud-init). At this stage you have an empty PDB with only Oracle defaults.

---

### 5B — Compute stack + bootstrap

**From your laptop**

```bash
# Compute stack → Outputs
COMPUTE_IP=<compute_public_ip>
AEGIS_URL=<aegis_vault_url>
LUMINA_URL=<luminaforge_url>

# 1. Bootstrap finished
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'grep SUCCESS /var/log/sqlfw-install.log'

# 2. Services running
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo systemctl is-active aegis-vault luminaforge'

# 3. HTTP smoke test
curl -s -o /dev/null -w "Aegis %{http_code}\n"  $AEGIS_URL
curl -s -o /dev/null -w "Lumina %{http_code}\n" $LUMINA_URL
```

Expect: `[SUCCESS] Apps + DB schema ready`, both services `active`, HTTP **200** or **307**.

**Browser login (no password — demo apps)**

| App | URL | What you should see |
|-----|-----|---------------------|
| **Aegis Vault** | `aegis_vault_url` → `http://<your_compute_public_ip>:3000` | SOC dashboard, sidebar (Dashboard, Demo Control, …) |
| **LuminaForge** (direct bypass) | `luminaforge_url` → `http://<your_compute_public_ip>:3001` | Demo fintech UI, nav tabs |
| **LuminaForge via WAF** | `luminaforge_waf_url` → `http://<your_lb_public_ip>/` | WAF `demo-waf-firewall` → LB → backend `:3001` |
| **Compute :80 shortcut** | `http://<your_compute_public_ip>/` | When `enable_waf = true`, should redirect to `luminaforge_waf_url`. If you see the nginx default page, use the WAF LB URL instead |

> **Existing public demo (optional):** The maintainers may run a shared demo whose IPs are listed in the [repo README](../README.md) and [`docs/DEMO-BRIEFING-SCRIPT.md`](../docs/DEMO-BRIEFING-SCRIPT.md). Those IPs are **not** your Resource Manager Outputs and may rotate. For a new tenancy deploy, always use **your** compute stack Outputs.

**LuminaForge routes** — use your `luminaforge_waf_url` (WAF) or `luminaforge_url` (direct):

| Tab | Path | Attack point |
|-----|------|--------------|
| Dashboard | `/` | — |
| Market | `/market` | Point 1 (investment instrument search) |
| Transactions | `/transactions` | Point 2 |
| Statement | `/statement` | Point 3 |
| Portfolio / Bulk | `/bulk` | Point 4 |

Verify compute `:80` redirect: `curl -sI http://$COMPUTE_IP/ | grep -i location` → should reference `luminaforge_waf_url`.

**WAF troubleshooting:** LuminaForge does **not** listen on port 80 on the compute VM. Backend set uses the compute **reserved private IP** (`:3001`). DB stack security list already allows **`compute_subnet_cidr` → TCP 3001** for LB health checks.

### 5B-waf — OCI WAF policy (provisioned by compute Terraform)

The compute stack creates the same resources as the manual older demo stack:

| Resource | Terraform name |
|----------|----------------|
| Load Balancer | `${project_prefix}-lb` (default `sqlfw-demo-lb`) |
| WAF policy | `${project_prefix}-waf-policy` (default `sqlfw-demo-waf-policy`) |
| WAF attachment | `demo-waf-firewall` |
| Block action | `Block SQLi 403` (HTTP 403 JSON) |

**Traffic:** Internet → **LB :80** (WAF) → compute **private IP :3001**. LuminaForge mirrors attack fields into the URL query string (`waf-query-mirror.ts`) so WAF access-control rules can inspect POST bodies.

Policy rules are loaded from `terraform/compute/waf/` (same JSON as `terraform/waf-request-*.json`).

**Compute stack variable** (optional):

```hcl
enable_waf = true   # default — set false to skip LB/WAF (direct :3001 only)
```

**Re-deploying an existing compute stack** without WAF: first Apply with this change may **replace the compute instance** (reserved private IP for LB backend). Plan carefully; destroy/recreate compute is safest for a clean demo.

**Manual policy update** (only if you edit JSON and need to refresh without full stack replace):

```bash
export SUPPRESS_LABEL_WARNING=True
WAF_POLICY=<web_app_firewall_policy_ocid>   # compute stack output waf_policy_id
ETAG=$(oci waf web-app-firewall-policy get --web-app-firewall-policy-id "$WAF_POLICY" --query 'etag' --raw-output)

oci waf web-app-firewall-policy update \
  --web-app-firewall-policy-id "$WAF_POLICY" \
  --request-access-control file://terraform/compute/waf/waf-request-access-control-sqli.json \
  --request-protection file://terraform/compute/waf/waf-request-protection-sqli.json \
  --if-match "$ETAG" --force
```

**Legacy manual redirect** (only if cloud-init ran before WAF was added):

```bash
WAF_LB_URL=http://<lb_public_ip> sudo -E bash scripts/setup-waf-port80-redirect.sh
```

**Demo contrast:** `:3001` direct bypasses WAF (SQL Firewall only); `<lb_public_ip>/` shows edge blocking (**403**) for standard UI payloads.

#### WAF vs SQL Firewall differentiation (all attack tabs)

Presenter pattern on **`http://<lb_public_ip>/`**: canonical payload → **403** (WAF) → bypass payload from secondary UI hint → **200** (DB) → Aegis Vault **:3000** shows SQL Firewall violation.

| Tab | Screen | Canonical (WAF **403**) | WAF bypass (LB **200**) |
|-----|--------|-------------------------|-------------------------|
| Market | Market Explorer / investment search (step 1 only) | `' OR '1'='1` | `'/**/OR/**/'1'='1` (hint: “WAF bypass step 1”) |
| Transactions | Ledger lookup | `x' OR user_id<>1 --` | `/**/OR/**/REGEXP_LIKE` / `HEXTORAW` (hint line 2) |
| Statement | Tax Institution ID | `0 UNION SELECT …` | **No bypass** — use `:3001` for credential leak (UI fallback hint) |
| Bulk | Batch note | `; UPDATE users …` | **No bypass** — use `:3001` for role escalation (UI fallback hint) |

Market steps 2–3 (UNION / `user_tables` / `user_tab_columns`) remain **WAF-blocked** on the LB URL; use `:3001` for full recon ladder.

**Transaction History** three-layer script:

| Step | URL | Payload | Expected |
|------|-----|---------|----------|
| 1 — WAF blocks | `http://<lb_public_ip>/` | `x' OR user_id<>1 --` (hint line 1) | **403** JSON from OCI WAF |
| 2 — WAF bypassed | `http://<lb_public_ip>/` | XML/hex `REGEXP_LIKE` / `HEXTORAW` payload (hint line 2; copy from UI) | **200** + cross-client rows (`user_id` 3, 4, 5, 8, 9) |
| 3 — SQL Firewall | Aegis Vault `:3000` | (same as step 2) | Violation row in Threat Feed |

The bypass payload hides `user_id` and plain `' OR '` inside a hex blob decoded at runtime by `DBMS_XMLGEN` / `UTL_RAW`. LuminaForge still mirrors `ref` into the query string (`waf-query-mirror.ts`); WAF JMESPath rules miss the obfuscated form.

Optional curl (mirrored query, same as UI):

```bash
LB=http://<lb_public_ip>
PAYLOAD="x'/**/OR/**/REGEXP_LIKE(DBMS_XMLGEN.GETXMLTYPE(utl_raw.cast_to_varchar2(HEXTORAW('73656c6563742027524553272066726f6d206475616c'))),'.') --"
ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$PAYLOAD")
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "$LB/api/transactions/filter?ref=$ENC" \
  -H "Content-Type: application/json" \
  -d "{\"ref\":$(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$PAYLOAD")}"
```

Direct `:3001` regression: all four canonical attack payloads still work without WAF in path.

---

### 5C — Verify database schema (from compute VM)

SSH as **`ubuntu`** to the compute VM. Use **`opc`** only when connecting to the **DB host** (Bastion or ProxyJump — see Step 2c).

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP
```

> **Note:** The compute VM has **no Oracle Client / sqlplus** by default. Prefer **Option 2** (re-run `oci-bootstrap-database.mjs`) for schema checks. Use Option 1 only if you install sqlplus or connect from SQL Developer.

**Option 1 — read bootstrap env and sqlplus** (optional; requires sqlplus on VM or remote client)

```bash
# Passwords and connect string (root-only file)
sudo grep -E '^(export DB_|export APP_)' /root/sqlfw-bootstrap.env

CONNECT_STRING="<paste db_connection_string from DB stack Outputs>"
APP_PW="<paste app_db_password from DB stack Outputs>"
SYS_PW="<paste sys_password from DB stack Outputs>"
PDB="<paste pdb_name, e.g. SQLFWPDB1>"
```

**Verify app user login**

```bash
sqlplus "AEGIS_APP/${APP_PW}@${CONNECT_STRING}"
```

```sql
SELECT USER FROM dual;
SELECT COUNT(*) AS table_count FROM user_tables;
-- expect AEGIS_APP tables (e.g. firewall-related objects)
EXIT;
```

```bash
sqlplus "luminaforge/${APP_PW}@${CONNECT_STRING}"
```

```sql
SELECT USER FROM dual;
SELECT table_name FROM user_tables ORDER BY 1;
-- expect demo tables, e.g. USERS, PORTFOLIO, TRANSACTIONS, LUXURY_ITEMS (investment catalog), …
EXIT;
```

**Verify SYS packages (bootstrap objects)**

```bash
sqlplus "sys/${SYS_PW}@${CONNECT_STRING} as sysdba"
```

```sql
ALTER SESSION SET CONTAINER = SQLFWPDB1;   -- your pdb_name

SELECT object_name, object_type, status
FROM   dba_objects
WHERE  owner = 'SYS'
  AND  object_name IN ('AEGIS_DEMO_CONTROL', 'AEGIS_FW_FLUSH_LOGS')
ORDER  BY 1, 2;
-- expect PACKAGE BODY / PACKAGE, STATUS = VALID

SELECT username, account_status
FROM   dba_users
WHERE  username IN ('AEGIS_APP', 'LUMINAFORGE');
-- both OPEN

SELECT COUNT(*) AS lumina_tables
FROM   dba_tables
WHERE  owner = 'LUMINAFORGE';
-- expect > 0 (demo schema loaded)

EXIT;
```

**Option 2 — re-run bootstrap log (should idempotently succeed)**

Stop apps first if bootstrap will drop users (`ORA-01940`):

```bash
sudo systemctl stop aegis-vault luminaforge
```

Pull latest code **as `odb_sec`** (repo is owned by that user — `sudo git pull` fails with *dubious ownership*):

```bash
sudo -u odb_sec git -C /home/odb_sec/apps/oracle-sql-firewall-demo pull origin main
```

```bash
sudo bash -c 'source /root/sqlfw-bootstrap.env && \
  cd /home/odb_sec/apps/oracle-sql-firewall-demo && \
  sudo -u odb_sec env \
    DB_CONNECT_STRING="$DB_CONNECT_STRING" \
    DB_SYS_PASSWORD="$DB_SYS_PASSWORD" \
    DB_PDB_NAME="$DB_PDB_NAME" \
    APP_DB_PASSWORD="$APP_DB_PASSWORD" \
    node scripts/oci-bootstrap-database.mjs'
sudo systemctl start aegis-vault luminaforge
```

Expect ending line: `[SUCCESS] Database bootstrap complete for PDB SQLFWPDB1`

**Option 3 — apply Demo Control grant only** (e.g. after adding `reinit_default_transaction_data` in v2.10.0+):

```bash
sudo systemctl stop aegis-vault luminaforge
sudo bash -c 'source /root/sqlfw-bootstrap.env && \
  cd /home/odb_sec/apps/oracle-sql-firewall-demo && \
  sudo -u odb_sec env \
    DB_CONNECT_STRING="$DB_CONNECT_STRING" \
    DB_SYS_PASSWORD="$DB_SYS_PASSWORD" \
    DB_PDB_NAME="$DB_PDB_NAME" \
    APP_DB_PASSWORD="$APP_DB_PASSWORD" \
    BOOTSTRAP_ONLY=Oracle_DB_Demo_Control_Grant.sql \
    node scripts/oci-bootstrap-database.mjs'
sudo systemctl start aegis-vault luminaforge
```

Verify package: `curl -s http://127.0.0.1:3000/api/build` on the VM (expect `dbPackageVersion` ≥ `2.10.0`).

---

### 5D — Verify apps ↔ database (end-to-end)

1. Open **LuminaForge** → any tab (e.g. Portfolio) — page loads without ORA errors
2. Open **Aegis Vault** → **Dashboard** — loads (may show zero violations initially)
3. **Demo Control** → **Initialize default demo policy** → success toast (requires LuminaForge on `:3001`)
4. Browse LuminaForge tabs → generate SQL traffic
5. **Aegis Dashboard** → violations appear (or **Threat Feed**)
6. Demo Control → **Stop SQL capture** → **Generate Allow List** → success
7. **(Optional)** Demo Control → §3.3 **Reinitialize default transaction data** — resets transaction rows only (no full PDB re-seed)

If step 3 fails with ORA error → schema/bootstrap issue (repeat 5C).  
If apps show connection errors → check `.env` on compute:

```bash
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo grep -E "^DB_" /home/odb_sec/apps/oracle-sql-firewall-demo/aegis-vault/.env'
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo grep -E "^DB_" /home/odb_sec/apps/oracle-sql-firewall-demo/luminaforge/.env'
ssh -i ~/.ssh/id_ed25519_sqlfw ubuntu@$COMPUTE_IP \
  'sudo grep -E "^export DB_" /root/sqlfw-bootstrap.env'
```

`DB_CONNECTION_STRING`, `DB_PASSWORD`, and `DB_CONTAINER` in **both** app `.env` files must match `/root/sqlfw-bootstrap.env` and DB stack Outputs. Aegis and LuminaForge must point at the **same** PDB.

---

### 5E — Verification checklist (printable)

| # | Check | Pass? |
|---|--------|-------|
| 1 | DB stack Apply **Succeeded** | ☐ |
| 2 | Base DB lifecycle **AVAILABLE** | ☐ |
| 3 | Compute stack Apply **Succeeded** | ☐ |
| 4 | `/var/log/sqlfw-install.log` → `[SUCCESS]` | ☐ |
| 5 | `systemctl is-active` → both **active** | ☐ |
| 6 | Aegis + LuminaForge HTTP 200/307 | ☐ |
| 7 | Schema/bootstrap OK (Option 2 log or sqlplus if installed) | ☐ |
| 8 | `AEGIS_DEMO_CONTROL` package **VALID** | ☐ |
| 9 | LuminaForge `user_tables` count > 0 | ☐ |
| 10 | Demo Control **Initialize default demo policy** OK | ☐ |
| 11 | Violations visible in Aegis after LuminaForge traffic | ☐ |
| 12 | `luminaforge_waf_url` output set; LB + WAF **ACTIVE** in Console | ☐ |
| 13 | WAF demo: `' OR '1'='1` on LB URL → **403** + browser alert | ☐ |

---

## Re-deploy after Terraform or code changes

| Change type | What to do |
|-------------|------------|
| **Terraform `.tf` / cloud-init** | `./package-stacks.sh` → re-upload zip → **Plan → Apply** on affected stack |
| **WAF policy JSON only** | Edit `terraform/compute/waf/*.json` → re-Apply compute stack (or `oci waf web-app-firewall-policy update` with `waf_policy_id` output) |
| **`allow_ssh_cidr` only** | Update DB stack Variables → **Plan → Apply** on **DB stack** (not compute) |
| **App code on GitHub** | Push to `main` → re-run install script on VM (or recreate compute instance) |
| **Demo Control grant / package only** | `BOOTSTRAP_ONLY=Oracle_DB_Demo_Control_Grant.sql` via bootstrap script (§5C Option 3) |
| **Private → public repo** | Remove token from `github_repo_url`; update `/root/sqlfw-bootstrap.env`; re-run install script |

**Full refresh (new VM + latest zip):**

1. `./package-stacks.sh` from `terraform/`
2. DB stack: upload new zip only if DB `.tf` changed; Apply if `allow_ssh_cidr` changed
3. Compute stack: upload new `sqlfw-compute-stack.zip` → Plan → Apply (replaces instance, cloud-init runs)

---

Destroy **compute stack** first, then **DB stack** (each stack → **Destroy** job → confirm).

---

## Quick troubleshooting

| Problem | Fix |
|---------|-----|
| `curl` returns **000** / connection refused; SSH works | **Two layers:** (1) DB stack `allow_ssh_cidr` includes your IP — **Apply** DB stack; (2) ufw on VM — `sudo ufw allow 3000/tcp && sudo ufw allow 3001/tcp && sudo ufw --force enable` (cloud-init does this on new VMs) |
| Cannot open `:3000` / `:3001` from browser | Set `allow_ssh_cidr` on **DB stack** → **Plan → Apply**; confirm `sudo ufw status` shows 3000/tcp and 3001/tcp ALLOW |
| Apply OK but apps down | Wait 10–20 min; `sudo tail -f /var/log/sqlfw-install.log` |
| `Permission denied` on `/var/log/sqlfw-install.log` | Use `sudo bash -c '.../sqlfw-install-apps.sh >> /var/log/sqlfw-install.log 2>&1'` — not `sudo cmd >> log` |
| Compute **plan** fails on remote state | Set **`db_stack_id`** to DB stack OCID (`ocid1.ormstack...`); DB stack Apply must **Succeeded** first |
| `db_home_version` invalid / 400 InvalidParameter | Re-run [Check 26ai DB home version](#check-26ai-db-home-version-before-db-stack): list all versions first, then filter with `jq` for `26.x`. Empty = wrong region, unset `COMPARTMENT_ID`, or 26ai not in region |
| Password error | Set compliant `sys_password` / `app_db_password` in Variables (no `sys` / `Oracle` substrings); or clear vars to use demo-only Terraform defaults |
| Object Storage / subnet error | Upload latest zip (service gateway + security list egress); re-Apply DB stack |
| Git clone fails on VM | Public repo URL without token, or PAT in `github_repo_url`; update `/root/sqlfw-bootstrap.env` and re-run install |
| `MODULE_NOT_FOUND` for `oci-bootstrap-database.mjs` | Push `scripts/oci-bootstrap-database.mjs` to GitHub `main`; re-run install script |
| DB listener timeout in log | DB not **AVAILABLE** yet; wait, then re-run install script |
| Demo Control ORA errors / invalid package | Bootstrap incomplete — stop apps, re-run bootstrap (5C Option 2); check `AEGIS_DEMO_CONTROL` **VALID** |
| Bootstrap **ORA-47630** (`allow list … does not exist`) | Fresh PDB has no `AEGIS_APP` allow-list yet — bootstrap handles this idempotently. Re-run bootstrap (5C Option 2) |
| Bootstrap **ORA-01920** (`user name … conflicts`) | Partial bootstrap already created `AEGIS_APP` / `luminaforge` — bootstrap handles this idempotently. Re-run bootstrap (5C Option 2) |
| Bootstrap **NJS-533 / ORA-12660** (NNE negotiation failed) | Run [Step 2c](#step-2c--configure-db-for-thin-mode-clients-required) on the DB VM, then re-run `sqlfw-install-apps.sh` on compute |
| Demo Control OK on LuminaForge but Aegis ORA / wrong DB | `.env` drift — compare both app `.env` files to `/root/sqlfw-bootstrap.env` (§5D) |
| **Reinitialize default transaction data** unavailable | Re-apply grant v2.10.0+ (§5C Option 3); verify `/api/build` |
| `git pull` **dubious ownership** on VM | Repo owned by `odb_sec` — use `sudo -u odb_sec git -C /home/odb_sec/apps/oracle-sql-firewall-demo pull origin main` before bootstrap |
| RM job permission denied | Add `manage orm-stacks` + `manage orm-jobs` (+ resource-family policies) |
| VCN / subnet overlap error | Change `vcn_cidr` / subnet CIDRs; do not use VCN Wizard |
| Updated zip but RM uses old config | Re-run `./package-stacks.sh` (script deletes old zips first), re-upload both stacks |

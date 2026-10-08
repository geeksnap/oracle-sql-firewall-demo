# Download OCI Console Terraform (Resource Manager) stacks

Deploy the SQL Firewall demo from **OCI Console → Developer Services → Resource Manager** without a local Terraform CLI.

## Release assets (preferred)

From the GitHub repository **Releases** page:

| Asset | Upload order | Contents |
|-------|--------------|----------|
| [`sqlfw-db-stack.zip`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/latest) | **1st** | `terraform/db` — VCN + Base DB 26ai + `schema.yaml` |
| [`sqlfw-compute-stack.zip`](https://github.com/geeksnap/oracle-sql-firewall-demo/releases/latest) | **2nd** | `terraform/compute` — apps VM (+ WAF/LB) + `schema.yaml` |

1. Open [Releases](https://github.com/geeksnap/oracle-sql-firewall-demo/releases) → choose a release that lists both assets (or **Latest**).
2. Download both zips.
3. Follow **[OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md)** starting at **Step 2** (DB stack).

If no release assets exist yet, use the alternate build below, or run **Actions → Package OCI Resource Manager stacks → Run workflow**, then download the `sqlfw-orm-stacks` artifact.

## Alternate — build from a clone

```bash
git clone https://github.com/geeksnap/oracle-sql-firewall-demo.git
cd oracle-sql-firewall-demo/terraform
chmod +x package-stacks.sh
./package-stacks.sh
```

Produces gitignored zips in this directory (`sqlfw-*-stack.zip`).

## Deploy order (do not reverse)

1. **DB stack** — Create Stack → upload `sqlfw-db-stack.zip` → Plan → Apply (~60–90 min).
2. Copy **DB stack OCID** (`ocid1.ormstack...`).
3. **Compute stack** — upload `sqlfw-compute-stack.zip` → set **`db_stack_id`** → Plan → Apply.

Full steps, IAM, passwords, and troubleshooting: [OCI-CONSOLE-QUICKSTART.md](OCI-CONSOLE-QUICKSTART.md) · [README.md](README.md)

## Secrets

Never put real passwords, PATs, or private keys into the zip. Enter them only as Resource Manager **Variables** (schema marks passwords as sensitive). Example files use placeholders only.

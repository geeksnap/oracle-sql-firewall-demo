# Oracle AI Database 26ai SQL Firewall Live Demo

**Aegis Vault** (SOC dashboard) + **LuminaForge** (intentionally vulnerable fintech demo app) for Oracle SQL Firewall cross-monitoring demonstrations.

| App | Port | Path |
|-----|------|------|
| Aegis Vault | 3000 | `aegis-vault/` |
| LuminaForge | 3001 | `luminaforge/` |

> LuminaForge is **intentionally vulnerable**. Use a **private** repository and restrict network access in any shared environment.

## Quick start (local)

```bash
# Database: run Oracle_DB_Setup.sql + Oracle_DB_SYS_Demo_Grants_All.sql as SYS AS SYSDBA

cp aegis-vault/.env.example aegis-vault/.env
cp luminaforge/.env.example luminaforge/.env
# Edit .env files with DB_CONNECTION_STRING and DB_PASSWORD

cd aegis-vault && npm ci && cd ..
cd luminaforge && npm ci && cd ..

./start.sh --check-db    # verify database
./start.sh               # Aegis :3000 + LuminaForge :3001
./stop.sh                # stop both
```

## Start/stop

| Environment | Apps | Database |
|-------------|------|----------|
| **Local dev** | `./start.sh` / `./stop.sh` (`aegis` \| `lumina` \| `both`; `--check-db`, `--skip-db-check`, `--mode prod`) | PDB must already be running; `./start.sh --check-db` probes connectivity |
| **OCI compute VM** | `./start.sh --mode oci` / `./stop.sh --mode oci` (systemd: `aegis-vault`, `luminaforge`) | Start Base DB in OCI Console (**AVAILABLE**) before apps; stop Base DB after `./stop.sh --mode oci` to save cost |

OCI deploy and teardown: [`terraform/README.md`](terraform/README.md) · Console-only path: [`terraform/OCI-CONSOLE-QUICKSTART.md`](terraform/OCI-CONSOLE-QUICKSTART.md)

## Documentation

| Document | Purpose |
|----------|---------|
| [`terraform/README.md`](terraform/README.md) | **OCI Terraform** — DB + Compute stacks, GitHub PAT, demo policy init |
| [`terraform/OCI-CONSOLE-QUICKSTART.md`](terraform/OCI-CONSOLE-QUICKSTART.md) | One-page OCI Console deploy (no local `terraform apply`) |
| [`aegis-vault/SPEC-aegis.md`](aegis-vault/SPEC-aegis.md) | Aegis Vault OpenSpec (Demo Control, SOC UI) |
| [`luminaforge/SPEC-luminaforge.md`](luminaforge/SPEC-luminaforge.md) | LuminaForge OpenSpec (attack surface, firewall context) |
| [`scripts/data_pump_setup.sql`](scripts/data_pump_setup.sql) + [`scripts/export_full_database.sh`](scripts/export_full_database.sh) | PDB Data Pump export |

## Key SQL scripts (repo root)

| Script | Run as |
|--------|--------|
| `Oracle_DB_Setup.sql` | SYS AS SYSDBA |
| `Oracle_DB_SYS_Demo_Grants_All.sql` | SYS AS SYSDBA |
| `luminaforge/scripts/reset-demo-data.sql` | SYS or luminaforge (post-demo reset) |

## OpenSpec workflow

Changes are managed under `openspec/` with Cursor commands: `/opsx-propose`, `/opsx-apply`, `/opsx-archive`.

Built for **Oracle Database 26ai** SQL Firewall demonstrations.

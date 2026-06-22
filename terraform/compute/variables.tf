# =============================================================================
# Stack 2 — OCI Compute VM for Aegis Vault + LuminaForge
# Reads DB stack outputs via terraform_remote_state and deploys both apps.
# =============================================================================

variable "region" {
  type = string
}

variable "compartment_id" {
  description = "Must match DB stack compartment"
  type        = string
}

variable "project_prefix" {
  type    = string
  default = "sqlfw-demo"
}

variable "db_stack_id" {
  description = "REQUIRED for OCI Resource Manager: OCID of the DB stack (Stack details → Stack information). Leave empty only for local CLI with db_state_path."
  type        = string
  default     = null

  validation {
    condition     = var.db_stack_id == null || can(regex("^ocid1\\.ormstack\\.", var.db_stack_id))
    error_message = "db_stack_id must be a Resource Manager stack OCID (starts with ocid1.ormstack.). Copy from your DB stack in the Console."
  }
}

variable "db_state_path" {
  description = "Path to DB stack terraform.tfstate for local CLI apply. Ignored when db_stack_id is set."
  type        = string
  default     = "../db/terraform.tfstate"
}

variable "compute_shape" {
  type    = string
  default = "VM.Standard.E4.Flex"
}

variable "compute_ocpus" {
  type    = number
  default = 2
}

variable "compute_memory_gb" {
  type    = number
  default = 16
}

variable "ssh_public_key" {
  type = string
}

variable "github_repo_url" {
  description = "HTTPS or SSH clone URL (private repo: use https://<token>@github.com/org/repo.git)"
  type        = string
  default     = "https://github.com/geeksnap/oracle-sql-firewall-demo.git"
}

variable "github_branch" {
  type    = string
  default = "main"
}

variable "allow_ingress_cidr" {
  description = "UNUSED — ingress is controlled by allow_ssh_cidr in the DB stack (compute_sl security list). Kept for backward compatibility."
  type        = string
  default     = "0.0.0.0/0"
}

variable "app_user" {
  type    = string
  default = "odb_sec"
}

variable "override_db_connection_string" {
  description = "Set to override remote state DB connection (optional)"
  type        = string
  default     = null
}

variable "override_app_db_password" {
  type      = string
  sensitive = true
  default   = null
}

variable "override_sys_password" {
  type      = string
  sensitive = true
  default   = null
}

variable "enable_waf" {
  description = "Provision OCI Load Balancer + WAF (sqlfw-demo-lb / demo-wap-firewall) for LuminaForge edge demo path"
  type        = bool
  default     = true
}

variable "load_balancer_bandwidth_mbps" {
  description = "Flexible load balancer bandwidth (Mbps) for the WAF entry point"
  type        = number
  default     = 10
}

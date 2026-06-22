# =============================================================================
# Stack 1 — OCI Base Database (DBCS VM) for SQL Firewall demo
# Provisions: VCN, DB subnet, Compute subnet, security rules, DB System + PDB
# Schema bootstrap runs from Compute stack (scripts/oci-bootstrap-database.mjs)
# =============================================================================

variable "region" {
  description = "OCI region, e.g. ap-singapore-1"
  type        = string
}

variable "compartment_id" {
  description = "OCID of the target compartment"
  type        = string
}

variable "project_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "sqlfw-demo"
}

variable "vcn_cidr" {
  type    = string
  default = "10.40.0.0/16"
}

variable "db_subnet_cidr" {
  type    = string
  default = "10.40.1.0/24"
}

variable "compute_subnet_cidr" {
  type    = string
  default = "10.40.0.0/24"
}

variable "db_shape" {
  description = "DB system shape (Flex)"
  type        = string
  default     = "VM.Standard.E4.Flex"
}

variable "db_cpu_core_count" {
  type    = number
  default = 2
}

variable "db_data_storage_gb" {
  type    = number
  default = 256
}

variable "db_home_version" {
  description = "Oracle DB home version. Must match an exact string from ListDbVersions / Base Database Create in YOUR region (26ai initial release: 23.26.0.0.0)."
  type        = string
  default     = "23.26.0.0.0"
}

variable "db_edition" {
  type    = string
  default = "ENTERPRISE_EDITION"
}

variable "license_model" {
  type    = string
  default = "LICENSE_INCLUDED"
}

variable "pdb_name" {
  description = "Pluggable database name (used by demo SQL bootstrap)"
  type        = string
  default     = "SQLFWPDB1"
}

variable "db_hostname" {
  type    = string
  default = "sqlfwdb"
}

variable "ssh_public_key" {
  description = "SSH public key for DB host emergency access"
  type        = string
}

variable "sys_password" {
  description = "SYS / SYSTEM password. Cannot contain 'Oracle' or 'sys'. OCI: 9+ chars, 2 upper, 2 lower, 2 digit, 2 of _ - #."
  type        = string
  sensitive   = true
  default     = "DbAdm12_Ab-cdXy"
}

variable "app_db_password" {
  description = "Password for AEGIS_APP and luminaforge DB users. Cannot contain 'Oracle'."
  type        = string
  sensitive   = true
  default     = "AppDb34_Cd-efGh"
}

variable "allow_ssh_cidr" {
  description = "CIDR for SSH (22) on DB/compute and app ports 3000/3001 on compute subnet"
  type        = string
  default     = "0.0.0.0/0"
}

output "stack" {
  value = "db"
}

output "vcn_id" {
  value = oci_core_vcn.demo.id
}

output "db_subnet_id" {
  value = oci_core_subnet.db.id
}

output "compute_subnet_id" {
  value = oci_core_subnet.compute.id
}

output "db_system_id" {
  value = oci_database_db_system.sqlfw.id
}

output "db_private_ip" {
  description = "DB host FQDN in VCN (resolves to private IP via VCN DNS)"
  value       = local.db_host_fqdn
}

output "db_host_fqdn" {
  value = local.db_host_fqdn
}

output "pdb_name" {
  value = local.pdb_name_upper
}

output "pdb_service_name" {
  value = local.pdb_service_fqdn
}

output "db_connection_string" {
  value = local.db_connect_string
}

output "db_hostname" {
  value = var.db_hostname
}

output "sys_password" {
  value     = local.sys_password
  sensitive = true
}

output "app_db_password" {
  value     = local.app_db_password
  sensitive = true
}

output "region" {
  value = var.region
}

output "compartment_id" {
  value = var.compartment_id
}

output "project_prefix" {
  value = var.project_prefix
}

output "demo_urls_note" {
  value = "After compute stack apply: Aegis http://<compute_public_ip>:3000 LuminaForge http://<compute_public_ip>:3001"
}

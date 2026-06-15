output "compute_instance_id" {
  value = oci_core_instance.apps.id
}

output "compute_public_ip" {
  value = local.compute_public_ip
}

output "aegis_vault_url" {
  value = "http://${local.compute_public_ip}:3000"
}

output "luminaforge_url" {
  value = "http://${local.compute_public_ip}:3001"
}

output "db_connection_string" {
  value     = local.db_connect_string
  sensitive = false
}

output "ssh_command" {
  value = "ssh opc@${local.compute_public_ip}"
}

output "install_log" {
  value = "ssh opc@${local.compute_public_ip} 'sudo tail -f /var/log/sqlfw-install.log'"
}

output "demo_control_note" {
  value = <<-EOT
    After cloud-init completes:
    1. Open Aegis Vault → Demo Control
    2. Initialize default demo policy (LuminaForge must be running on :3001)
    3. Browse LuminaForge → Stop SQL capture → Generate Allow List
  EOT
}

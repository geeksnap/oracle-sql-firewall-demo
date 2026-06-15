#!/usr/bin/env bash
# Package each Terraform stack as a zip for OCI Resource Manager (Console Terraform).
# Upload each zip as a separate stack. DB stack first, then compute with db_stack_id.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${ROOT}"

pack() {
  local dir="$1"
  local name="$2"
  local zip="${OUT}/${name}.zip"
  rm -f "${zip}"
  echo "Creating ${zip} from ${dir}/"
  (
    cd "${dir}"
    zip -r "${zip}" . \
      -x "*.tfvars" \
      -x ".terraform/*" \
      -x ".terraform.lock.hcl" \
      -x "terraform.tfstate*" \
      -x "*.zip"
  )
  echo "  -> $(du -h "${zip}" | cut -f1)"
}

pack "${ROOT}/db" "sqlfw-db-stack"
pack "${ROOT}/compute" "sqlfw-compute-stack"

echo ""
echo "Upload to OCI Console:"
echo "  Developer Services → Resource Manager → Stacks → Create stack"
echo "  1. sqlfw-db-stack.zip   (apply first)"
echo "  2. sqlfw-compute-stack.zip (set db_stack_id to DB stack OCID)"

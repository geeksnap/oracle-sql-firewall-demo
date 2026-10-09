#!/usr/bin/env bash
# Package each Terraform stack as a zip for OCI Resource Manager (Console Terraform).
# Upload each zip as a separate stack. DB stack first, then compute with db_stack_id.
#
# Includes schema.yaml (Console variable UI). Excludes local state, real tfvars, and credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${ROOT}"

pack() {
  local dir="$1"
  local name="$2"
  local zip="${OUT}/${name}.zip"
  rm -f "${zip}"
  if [[ ! -f "${dir}/schema.yaml" ]]; then
    echo "ERROR: missing ${dir}/schema.yaml (required for Resource Manager Console UI)" >&2
    exit 1
  fi
  echo "Creating ${zip} from ${dir}/"
  (
    cd "${dir}"
    # Zip contents at archive root for Resource Manager "My configuration → .Zip file"
    zip -r "${zip}" . \
      -x "*.tfvars" \
      -x ".terraform/*" \
      -x ".terraform.lock.hcl" \
      -x "terraform.tfstate*" \
      -x "db-remote.tfstate*" \
      -x "*.zip" \
      -x ".git/*" \
      -x "**/.DS_Store"
  )
  if ! unzip -l "${zip}" | awk '{print $4}' | grep -qx 'schema.yaml'; then
    echo "ERROR: schema.yaml not at zip root in ${zip}" >&2
    exit 1
  fi
  if ! unzip -l "${zip}" | awk '{print $4}' | grep -E '\.tf$' >/dev/null; then
    echo "ERROR: no .tf files at zip root in ${zip}" >&2
    exit 1
  fi
  echo "  -> $(du -h "${zip}" | cut -f1)"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${zip}"
  else
    shasum -a 256 "${zip}"
  fi
}

pack "${ROOT}/db" "sqlfw-db-stack"
pack "${ROOT}/compute" "sqlfw-compute-stack"

echo ""
echo "Checksums written above. Upload to OCI Console:"
echo "  Developer Services → Resource Manager → Stacks → Create stack"
echo "  1. sqlfw-db-stack.zip   (apply first)"
echo "  2. sqlfw-compute-stack.zip (set db_stack_id to DB stack OCID)"
echo ""
echo "Or download Release assets — see DOWNLOAD.md"

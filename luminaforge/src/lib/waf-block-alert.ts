export const WAF_BLOCK_ALERT_MESSAGE =
  "SQL injection detected by OCI WAF and blocked.";

export const WAF_BLOCK_INLINE_ERROR = "Blocked by OCI WAF";

export function alertIfWafBlocked(status: number): boolean {
  if (status === 403) {
    window.alert(WAF_BLOCK_ALERT_MESSAGE);
    return true;
  }
  return false;
}

export function wafBlockErrorMessage(
  status: number,
  fallback?: string,
  dataMessage?: string,
): string {
  if (status === 403) {
    return dataMessage ?? WAF_BLOCK_INLINE_ERROR;
  }
  return fallback ?? `HTTP ${status}`;
}

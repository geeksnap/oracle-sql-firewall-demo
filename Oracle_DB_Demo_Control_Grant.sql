-- ========================================================================
-- Run once as SYS AS SYSDBA (PDB AHDB2605_PDB1)
-- Demo Control: whitelisted SQL Firewall admin for AEGIS_APP via Aegis Vault UI
-- Package version: 2.9.0 (must match aegis-vault/build-info.json)
-- ========================================================================

ALTER SESSION SET CONTAINER = AHDB2605_PDB1;

@@sql/luminaforge_bootstrap_benign.sql

CREATE OR REPLACE PACKAGE SYS.aegis_demo_control
AUTHID DEFINER
AS
  c_package_version CONSTANT VARCHAR2(32) := '2.9.0';

  FUNCTION package_version RETURN VARCHAR2;
  PROCEDURE configure_aegis_soc(p_msg OUT VARCHAR2);
  PROCEDURE firewall_disable(p_msg OUT VARCHAR2);
  PROCEDURE firewall_enable(p_msg OUT VARCHAR2);
  PROCEDURE set_block(p_username IN VARCHAR2, p_block IN BOOLEAN, p_msg OUT VARCHAR2);
  PROCEDURE set_sql_block(p_username IN VARCHAR2, p_block IN BOOLEAN, p_msg OUT VARCHAR2);
  PROCEDURE set_sql_monitor(p_username IN VARCHAR2, p_enable IN BOOLEAN, p_msg OUT VARCHAR2);
  PROCEDURE set_capture(p_username IN VARCHAR2, p_start IN BOOLEAN, p_msg OUT VARCHAR2);
  PROCEDURE generate_allow_list(p_username IN VARCHAR2, p_msg OUT VARCHAR2);
  PROCEDURE disable_allow_list(p_username IN VARCHAR2, p_msg OUT VARCHAR2);
  PROCEDURE purge_violations(p_username IN VARCHAR2, p_msg OUT VARCHAR2);
  PROCEDURE flush_logs(p_msg OUT VARCHAR2);
  PROCEDURE view_violations(p_username IN VARCHAR2, p_cursor OUT SYS_REFCURSOR);
  PROCEDURE view_allow_list(p_username IN VARCHAR2, p_cursor OUT SYS_REFCURSOR);
  PROCEDURE view_capture_status(p_username IN VARCHAR2, p_cursor OUT SYS_REFCURSOR);
  PROCEDURE clear_firewall_policy(p_username IN VARCHAR2, p_msg OUT VARCHAR2);
  PROCEDURE init_default_demo_policy(p_username IN VARCHAR2, p_msg OUT VARCHAR2);
  PROCEDURE finalize_default_demo_policy(p_username IN VARCHAR2, p_msg OUT VARCHAR2);
END aegis_demo_control;
/

CREATE OR REPLACE PACKAGE BODY SYS.aegis_demo_control
AS
  PROCEDURE ensure_pdb IS
  BEGIN
    EXECUTE IMMEDIATE 'ALTER SESSION SET CONTAINER = AHDB2605_PDB1';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLCODE != -1031 THEN
        RAISE;
      END IF;
  END ensure_pdb;

  FUNCTION package_version RETURN VARCHAR2 IS
  BEGIN
    RETURN c_package_version;
  END package_version;

  PROCEDURE configure_aegis_soc(p_msg OUT VARCHAR2) IS
  BEGIN
    ensure_pdb;
    BEGIN
      SYS.DBMS_SQL_FIREWALL.DISABLE_ALLOW_LIST(username => 'AEGIS_APP');
    EXCEPTION
      WHEN OTHERS THEN
        -- -24247: allow-list already disabled; -47630: no allow-list row yet (fresh PDB)
        IF SQLCODE NOT IN (-24247, -47630) THEN
          RAISE;
        END IF;
    END;
    p_msg :=
      'AEGIS_APP allow-list enforcement disabled (v' || c_package_version ||
      '). Demo Control + SOC polling can call SYS.aegis_demo_control.';
  END configure_aegis_soc;

  PROCEDURE firewall_disable(p_msg OUT VARCHAR2) IS
  BEGIN
    ensure_pdb;
    SYS.DBMS_SQL_FIREWALL.DISABLE;
    p_msg := 'SQL Firewall disabled globally (all captures and allow-lists stopped).';
  END firewall_disable;

  PROCEDURE firewall_enable(p_msg OUT VARCHAR2) IS
  BEGIN
    ensure_pdb;
    SYS.DBMS_SQL_FIREWALL.ENABLE;
    p_msg := 'SQL Firewall enabled globally.';
  END firewall_enable;

  PROCEDURE set_block(p_username IN VARCHAR2, p_block IN BOOLEAN, p_msg OUT VARCHAR2) IS
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20001,
        'Cannot change allow-list for AEGIS_APP (SOC user). Run @Oracle_DB_Repair_AEGIS_SOC.sql as SYS.'
      );
    END IF;
    ensure_pdb;
    -- ENABLE_ALLOW_LIST (not UPDATE_ALLOW_LIST_ENFORCEMENT alone) so STATUS becomes
    -- ENABLED; otherwise BLOCK=Y with STATUS=DISABLED never shows ENFORCED · BLOCK in UI.
    SYS.DBMS_SQL_FIREWALL.ENABLE_ALLOW_LIST(
      username => UPPER(p_username),
      enforce  => SYS.DBMS_SQL_FIREWALL.ENFORCE_ALL,
      block    => p_block
    );
    IF p_block THEN
      p_msg := 'Allow-list ENABLED with BLOCK ON for ' || UPPER(p_username) || '.';
    ELSE
      p_msg := 'Allow-list ENABLED with BLOCK OFF (log only) for ' || UPPER(p_username) || '.';
    END IF;
  END set_block;

  FUNCTION allow_list_block_flag(p_username IN VARCHAR2) RETURN BOOLEAN IS
    l_block VARCHAR2(16);
  BEGIN
    SELECT MAX(block)
    INTO   l_block
    FROM   sys.dba_sql_firewall_allow_lists
    WHERE  UPPER(username) = UPPER(p_username);

    RETURN UPPER(NVL(l_block, 'N')) IN ('Y', 'YES', 'TRUE', '1', 'ON');
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN FALSE;
  END allow_list_block_flag;

  PROCEDURE set_sql_block(p_username IN VARCHAR2, p_block IN BOOLEAN, p_msg OUT VARCHAR2) IS
    l_has_row NUMBER;
    l_status  VARCHAR2(32);
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20004,
        'Cannot change block SQL for AEGIS_APP (SOC detect-only).'
      );
    END IF;
    ensure_pdb;
    SELECT COUNT(*), MAX(status)
    INTO   l_has_row, l_status
    FROM   sys.dba_sql_firewall_allow_lists
    WHERE  UPPER(username) = UPPER(p_username);

    IF l_has_row > 0 AND UPPER(NVL(l_status, 'DISABLED')) = 'ENABLED' THEN
      SYS.DBMS_SQL_FIREWALL.UPDATE_ALLOW_LIST_ENFORCEMENT(
        username => UPPER(p_username),
        block    => p_block
      );
      p_msg :=
        'Block SQL ' || CASE WHEN p_block THEN 'ON' ELSE 'OFF' END ||
        ' for ' || UPPER(p_username) || ' (SQL Monitor unchanged).';
    ELSIF l_has_row > 0 THEN
      SYS.DBMS_SQL_FIREWALL.UPDATE_ALLOW_LIST_ENFORCEMENT(
        username => UPPER(p_username),
        block    => p_block
      );
      p_msg :=
        'Block SQL ' || CASE WHEN p_block THEN 'ON' ELSE 'OFF' END ||
        ' for ' || UPPER(p_username) || ' (SQL Monitor remains disabled).';
    ELSE
      SYS.DBMS_SQL_FIREWALL.ENABLE_ALLOW_LIST(
        username => UPPER(p_username),
        enforce  => SYS.DBMS_SQL_FIREWALL.ENFORCE_ALL,
        block    => p_block
      );
      p_msg :=
        'SQL Monitor enabled; block SQL ' ||
        CASE WHEN p_block THEN 'ON' ELSE 'OFF (log only)' END ||
        ' for ' || UPPER(p_username) || '.';
    END IF;
  END set_sql_block;

  PROCEDURE set_sql_monitor(p_username IN VARCHAR2, p_enable IN BOOLEAN, p_msg OUT VARCHAR2) IS
    l_preserve_block BOOLEAN;
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20005,
        'Cannot change SQL Monitor for AEGIS_APP (SOC detect-only, fixed in UI).'
      );
    END IF;
    ensure_pdb;
    IF p_enable THEN
      l_preserve_block := allow_list_block_flag(p_username);
      SYS.DBMS_SQL_FIREWALL.ENABLE_ALLOW_LIST(
        username => UPPER(p_username),
        enforce  => SYS.DBMS_SQL_FIREWALL.ENFORCE_ALL,
        block    => l_preserve_block
      );
      p_msg :=
        'SQL Monitor ENABLED for ' || UPPER(p_username) ||
        '; block SQL ' || CASE WHEN l_preserve_block THEN 'ON' ELSE 'OFF' END || ' (preserved).';
    ELSE
      SYS.DBMS_SQL_FIREWALL.DISABLE_ALLOW_LIST(username => UPPER(p_username));
      p_msg :=
        'SQL Monitor DISABLED for ' || UPPER(p_username) ||
        ' (block flag preserved in dictionary).';
    END IF;
  END set_sql_monitor;

  PROCEDURE set_capture(p_username IN VARCHAR2, p_start IN BOOLEAN, p_msg OUT VARCHAR2) IS
    l_exists NUMBER;
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20003,
        'Cannot change SQL capture for AEGIS_APP (SOC user). Use luminaforge only.'
      );
    END IF;
    ensure_pdb;
    SELECT COUNT(*)
    INTO   l_exists
    FROM   sys.dba_sql_firewall_captures
    WHERE  UPPER(username) = UPPER(p_username);

    IF p_start THEN
      IF l_exists = 0 THEN
        SYS.DBMS_SQL_FIREWALL.CREATE_CAPTURE(
          username       => UPPER(p_username),
          top_level_only => TRUE,
          start_capture  => TRUE
        );
        p_msg := 'SQL capture created and STARTED for ' || UPPER(p_username) || '.';
      ELSE
        SYS.DBMS_SQL_FIREWALL.START_CAPTURE(username => UPPER(p_username));
        p_msg := 'SQL capture STARTED for ' || UPPER(p_username) || '.';
      END IF;
    ELSE
      IF l_exists = 0 THEN
        p_msg := 'No capture row for ' || UPPER(p_username) || ' (nothing to stop).';
      ELSE
        SYS.DBMS_SQL_FIREWALL.STOP_CAPTURE(username => UPPER(p_username));
        p_msg := 'SQL capture STOPPED for ' || UPPER(p_username) || '.';
      END IF;
    END IF;
  END set_capture;

  PROCEDURE generate_allow_list(p_username IN VARCHAR2, p_msg OUT VARCHAR2) IS
    l_log_cnt NUMBER;
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20010,
        'Cannot generate allow-list for AEGIS_APP (SOC user). Use luminaforge only.'
      );
    END IF;
    ensure_pdb;

    -- Stop capture gracefully if still running
    BEGIN
      SYS.DBMS_SQL_FIREWALL.STOP_CAPTURE(username => UPPER(p_username));
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE NOT IN (-24247, -47627) THEN
          RAISE;
        END IF;
    END;

    SELECT COUNT(*)
    INTO   l_log_cnt
    FROM   sys.dba_sql_firewall_capture_logs
    WHERE  UPPER(username) = UPPER(p_username);

    IF l_log_cnt = 0 THEN
      RAISE_APPLICATION_ERROR(
        -20009,
        'No capture logs for ' || UPPER(p_username) ||
        '. Run SQL capture training first (Start SQL Capture → use app → Stop SQL Capture).'
      );
    END IF;

    SYS.DBMS_SQL_FIREWALL.GENERATE_ALLOW_LIST(username => UPPER(p_username));

    SYS.DBMS_SQL_FIREWALL.ENABLE_ALLOW_LIST(
      username => UPPER(p_username),
      enforce  => SYS.DBMS_SQL_FIREWALL.ENFORCE_ALL,
      block    => FALSE
    );

    p_msg :=
      'Allow-list generated for ' || UPPER(p_username) || ' from ' || l_log_cnt ||
      ' captured SQL statements. SQL Monitor ON, Block SQL OFF (log only). ' ||
      'Run "Enable block SQL" to start blocking injection attacks.';
  END generate_allow_list;

  PROCEDURE disable_allow_list(p_username IN VARCHAR2, p_msg OUT VARCHAR2) IS
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20002,
        'Use configure_aegis_soc or @Oracle_DB_Repair_AEGIS_SOC.sql as SYS for AEGIS_APP.'
      );
    END IF;
    ensure_pdb;
    SYS.DBMS_SQL_FIREWALL.DISABLE_ALLOW_LIST(username => UPPER(p_username));
    p_msg := 'SQL Monitor disabled for ' || UPPER(p_username) || '.';
  END disable_allow_list;

  PROCEDURE purge_violations(p_username IN VARCHAR2, p_msg OUT VARCHAR2) IS
  BEGIN
    ensure_pdb;
    IF p_username IS NULL THEN
      SYS.DBMS_SQL_FIREWALL.PURGE_LOG(
        username   => 'luminaforge',
        purge_time => NULL,
        log_type   => SYS.DBMS_SQL_FIREWALL.VIOLATION_LOG
      );
      SYS.DBMS_SQL_FIREWALL.PURGE_LOG(
        username   => 'AEGIS_APP',
        purge_time => NULL,
        log_type   => SYS.DBMS_SQL_FIREWALL.VIOLATION_LOG
      );
      p_msg := 'Violation logs purged for luminaforge and AEGIS_APP.';
    ELSE
      SYS.DBMS_SQL_FIREWALL.PURGE_LOG(
        username   => UPPER(p_username),
        purge_time => NULL,
        log_type   => SYS.DBMS_SQL_FIREWALL.VIOLATION_LOG
      );
      p_msg := 'Violation logs purged for ' || UPPER(p_username) || '.';
    END IF;
    SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS;
  END purge_violations;

  PROCEDURE flush_logs(p_msg OUT VARCHAR2) IS
  BEGIN
    ensure_pdb;
    SYS.DBMS_SQL_FIREWALL.FLUSH_LOGS;
    p_msg := 'In-memory SQL Firewall logs flushed to dictionary views.';
  END flush_logs;

  PROCEDURE view_violations(p_username IN VARCHAR2, p_cursor OUT SYS_REFCURSOR) IS
  BEGIN
    ensure_pdb;
    IF p_username IS NULL THEN
      OPEN p_cursor FOR
        SELECT TO_CHAR(occurred_at, 'HH24:MI:SS') AS at,
               username,
               firewall_action,
               cause,
               SUBSTR(sql_text, 1, 70) AS sql_snip
        FROM   sys.dba_sql_firewall_violations
        WHERE  UPPER(username) IN ('AEGIS_APP', 'LUMINAFORGE')
        ORDER  BY occurred_at DESC
        FETCH FIRST 20 ROWS ONLY;
    ELSE
      OPEN p_cursor FOR
        SELECT TO_CHAR(occurred_at, 'HH24:MI:SS') AS at,
               username,
               firewall_action,
               cause,
               SUBSTR(sql_text, 1, 70) AS sql_snip
        FROM   sys.dba_sql_firewall_violations
        WHERE  UPPER(username) = UPPER(p_username)
        ORDER  BY occurred_at DESC
        FETCH FIRST 20 ROWS ONLY;
    END IF;
  END view_violations;

  PROCEDURE view_allow_list(p_username IN VARCHAR2, p_cursor OUT SYS_REFCURSOR) IS
  BEGIN
    ensure_pdb;
    OPEN p_cursor FOR
      SELECT username, status, block, enforce, top_level_only
      FROM   sys.dba_sql_firewall_allow_lists
      WHERE  UPPER(username) = UPPER(p_username);
  END view_allow_list;

  PROCEDURE view_capture_status(p_username IN VARCHAR2, p_cursor OUT SYS_REFCURSOR) IS
  BEGIN
    ensure_pdb;
    OPEN p_cursor FOR
      SELECT username, status, top_level_only, last_started_on
      FROM   sys.dba_sql_firewall_captures
      WHERE  UPPER(username) = UPPER(p_username);
  END view_capture_status;

  PROCEDURE clear_firewall_policy(p_username IN VARCHAR2, p_msg OUT VARCHAR2) IS
    l_allow_cnt   NUMBER;
    l_allow_stat  VARCHAR2(32);
    l_capture_cnt NUMBER;
    l_capture_stat VARCHAR2(32);
    l_steps       VARCHAR2(4000) := NULL;
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20006,
        'Cannot clear firewall policy for AEGIS_APP (SOC user). Use luminaforge only.'
      );
    END IF;
    ensure_pdb;

    SELECT COUNT(*), MAX(status)
    INTO   l_allow_cnt, l_allow_stat
    FROM   sys.dba_sql_firewall_allow_lists
    WHERE  UPPER(username) = UPPER(p_username);

    IF l_allow_cnt > 0 THEN
      IF UPPER(NVL(l_allow_stat, 'DISABLED')) = 'ENABLED' THEN
        SYS.DBMS_SQL_FIREWALL.DISABLE_ALLOW_LIST(username => UPPER(p_username));
      END IF;
      SYS.DBMS_SQL_FIREWALL.DROP_ALLOW_LIST(username => UPPER(p_username));
      l_steps := 'allow-list dropped';
    END IF;

    SELECT COUNT(*), MAX(status)
    INTO   l_capture_cnt, l_capture_stat
    FROM   sys.dba_sql_firewall_captures
    WHERE  UPPER(username) = UPPER(p_username);

    IF l_capture_cnt > 0 THEN
      IF UPPER(NVL(l_capture_stat, 'DISABLED')) = 'ENABLED' THEN
        SYS.DBMS_SQL_FIREWALL.STOP_CAPTURE(username => UPPER(p_username));
      END IF;
      SYS.DBMS_SQL_FIREWALL.DROP_CAPTURE(username => UPPER(p_username));
      l_steps :=
        CASE
          WHEN l_steps IS NULL THEN 'capture dropped (logs removed)'
          ELSE l_steps || '; capture dropped (logs removed)'
        END;
    END IF;

    IF l_steps IS NULL THEN
      p_msg :=
        'No allow-list or capture for ' || UPPER(p_username) || ' (nothing to clear).';
    ELSE
      p_msg :=
        'Firewall policy cleared for ' || UPPER(p_username) || ': ' || l_steps ||
        '. Re-run capture training before GENERATE_ALLOW_LIST.';
    END IF;
  END clear_firewall_policy;

  PROCEDURE init_default_demo_policy(p_username IN VARCHAR2, p_msg OUT VARCHAR2) IS
    l_clear_msg   VARCHAR2(4000);
    l_capture_cnt NUMBER;
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20007,
        'Cannot init default policy for AEGIS_APP (SOC user). Use luminaforge only.'
      );
    END IF;
    IF UPPER(p_username) != 'LUMINAFORGE' THEN
      RAISE_APPLICATION_ERROR(-20008, 'Default demo policy is only defined for luminaforge.');
    END IF;
    ensure_pdb;

    clear_firewall_policy(p_username, l_clear_msg);

    SELECT COUNT(*)
    INTO   l_capture_cnt
    FROM   sys.dba_sql_firewall_captures
    WHERE  UPPER(username) = 'LUMINAFORGE';

    IF l_capture_cnt = 0 THEN
      SYS.DBMS_SQL_FIREWALL.CREATE_CAPTURE(
        username       => 'LUMINAFORGE',
        top_level_only => TRUE,
        start_capture  => FALSE
      );
    END IF;

    BEGIN
      SYS.DBMS_SQL_FIREWALL.START_CAPTURE(username => 'LUMINAFORGE');
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE NOT IN (-47626) THEN
          RAISE;
        END IF;
    END;

    p_msg :=
      'Capture started for LUMINAFORGE. Run benign SQL as luminaforge (app bootstrap), then finalize.';
  END init_default_demo_policy;

  PROCEDURE finalize_default_demo_policy(p_username IN VARCHAR2, p_msg OUT VARCHAR2) IS
    l_log_cnt NUMBER;
  BEGIN
    IF UPPER(p_username) = 'AEGIS_APP' THEN
      RAISE_APPLICATION_ERROR(
        -20007,
        'Cannot init default policy for AEGIS_APP (SOC user). Use luminaforge only.'
      );
    END IF;
    IF UPPER(p_username) != 'LUMINAFORGE' THEN
      RAISE_APPLICATION_ERROR(-20008, 'Default demo policy is only defined for luminaforge.');
    END IF;
    ensure_pdb;

    BEGIN
      SYS.DBMS_SQL_FIREWALL.STOP_CAPTURE(username => 'LUMINAFORGE');
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE NOT IN (-24247, -47627) THEN
          RAISE;
        END IF;
    END;

    SELECT COUNT(*)
    INTO   l_log_cnt
    FROM   sys.dba_sql_firewall_capture_logs
    WHERE  UPPER(username) = 'LUMINAFORGE';

    IF l_log_cnt = 0 THEN
      RAISE_APPLICATION_ERROR(
        -20009,
        'No capture logs for LUMINAFORGE. Benign SQL must run as user luminaforge while capture is on.'
      );
    END IF;

    SYS.DBMS_SQL_FIREWALL.GENERATE_ALLOW_LIST(username => 'LUMINAFORGE');

    BEGIN
      SYS.DBMS_SQL_FIREWALL.DROP_CAPTURE(username => 'LUMINAFORGE');
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE NOT IN (-24247) THEN
          RAISE;
        END IF;
    END;

    SYS.DBMS_SQL_FIREWALL.ENABLE_ALLOW_LIST(
      username => 'LUMINAFORGE',
      enforce  => SYS.DBMS_SQL_FIREWALL.ENFORCE_ALL,
      block    => FALSE
    );

    p_msg :=
      'Default demo policy for LUMINAFORGE: allow-list from benign baseline. ' ||
      'SQL Monitor ON, Block SQL OFF (log only). Capture removed.';
  END finalize_default_demo_policy;
END aegis_demo_control;
/

GRANT EXECUTE ON SYS.aegis_demo_control TO AEGIS_APP;

DECLARE
  l_msg VARCHAR2(4000);
BEGIN
  SYS.aegis_demo_control.configure_aegis_soc(l_msg);
  DBMS_OUTPUT.PUT_LINE(l_msg);
END;
/

PROMPT === Package version (expect 2.8.1 in app header) ===
SELECT SYS.aegis_demo_control.package_version() AS db_package_version FROM dual;

PROMPT === AEGIS_APP allow-list (should be DISABLED for SOC) ===
SELECT username, status, block, enforce
FROM   sys.dba_sql_firewall_allow_lists
WHERE  UPPER(username) = 'AEGIS_APP';

PROMPT === [SUCCESS] AEGIS_APP Demo Control v2.9.0 — generate_allow_list added ===

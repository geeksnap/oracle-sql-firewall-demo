import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  expandSqlplusIncludes,
  splitSqlBlocks,
} from "../scripts/oci-bootstrap-database.mjs";

const repoRoot = process.cwd();

test("Oracle_DB_Setup.sql expands aegis_demo_seed before initialize", () => {
  const setup = fs.readFileSync("Oracle_DB_Setup.sql", "utf8");
  assert.match(setup, /@@sql\/luminaforge_demo_seed\.sql/);
  const expanded = expandSqlplusIncludes(setup, repoRoot);
  assert.doesNotMatch(expanded, /^@@/m);
  assert.match(expanded, /CREATE OR REPLACE PACKAGE luminaforge\.aegis_demo_seed/);
  assert.match(expanded, /CREATE OR REPLACE PACKAGE BODY luminaforge\.aegis_demo_seed/);
  assert.match(expanded, /luminaforge\.aegis_demo_seed\.initialize/);

  const blocks = splitSqlBlocks(expanded);
  const pkgIdx = blocks.findIndex((block) =>
    /CREATE OR REPLACE PACKAGE luminaforge\.aegis_demo_seed/i.test(block),
  );
  const bodyIdx = blocks.findIndex((block) =>
    /CREATE OR REPLACE PACKAGE BODY luminaforge\.aegis_demo_seed/i.test(block),
  );
  const initIdx = blocks.findIndex((block) =>
    /aegis_demo_seed\.initialize/i.test(block),
  );
  assert.ok(pkgIdx >= 0, "package spec block missing");
  assert.ok(bodyIdx >= 0, "package body block missing");
  assert.ok(initIdx >= 0, "initialize block missing");
  assert.ok(pkgIdx < initIdx, "package spec must execute before initialize");
  assert.ok(bodyIdx < initIdx, "package body must execute before initialize");
});

test("Oracle_DB_Demo_Control_Grant.sql expands all four @@ includes", () => {
  const grant = fs.readFileSync("Oracle_DB_Demo_Control_Grant.sql", "utf8");
  const expanded = expandSqlplusIncludes(grant, repoRoot);
  assert.doesNotMatch(expanded, /^@@/m);
  assert.match(expanded, /CREATE OR REPLACE PACKAGE luminaforge\.aegis_demo_seed/);
  assert.match(expanded, /migrate_identity\('USERS'\)/);
  assert.match(expanded, /CREATE OR REPLACE PROCEDURE luminaforge\.aegis_demo_reinit_transactions/);
  assert.match(expanded, /CREATE OR REPLACE PROCEDURE luminaforge\.aegis_demo_bootstrap_benign/);
  const blocks = splitSqlBlocks(expanded);
  assert.ok(
    blocks.some((block) => /CREATE OR REPLACE PACKAGE luminaforge\.aegis_demo_seed/i.test(block)),
  );
  assert.ok(
    blocks.some((block) => /CREATE OR REPLACE PACKAGE BODY SYS\.aegis_demo_control/i.test(block)),
  );
});

test("missing @@ include fails instead of skipping", () => {
  assert.throws(
    () => expandSqlplusIncludes("@@sql/does-not-exist-seed.sql\n", repoRoot),
    /Missing SQL\*Plus @@ include: sql\/does-not-exist-seed\.sql/,
  );
});

test("splitSqlBlocks refuses unresolved @@ lines", () => {
  assert.throws(
    () => splitSqlBlocks("@@sql/luminaforge_demo_seed.sql\n"),
    /Unresolved SQL\*Plus include/,
  );
});

test("nested @@ includes resolve relative to the calling script", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sqlfw-@@-"));
  try {
    fs.writeFileSync(path.join(dir, "child.sql"), "SELECT 1 FROM dual;\n");
    fs.writeFileSync(path.join(dir, "parent.sql"), "@@child.sql\nSELECT 2 FROM dual;\n");
    const expanded = expandSqlplusIncludes("@@parent.sql\n", dir);
    assert.match(expanded, /SELECT 1 FROM dual/);
    assert.match(expanded, /SELECT 2 FROM dual/);
    assert.doesNotMatch(expanded, /@@/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

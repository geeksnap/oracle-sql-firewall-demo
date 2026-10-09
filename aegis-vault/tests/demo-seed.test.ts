import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";
import {
  BREAK_GLASS_COOKIE,
  clearBreakGlassGrantCookie,
  issueBreakGlassGrant,
  verifyBreakGlassGrant,
} from "../lib/break-glass-grant";
import { getDemoSeedConfig } from "../lib/demo-seed-config";
import { executeDemoSeedInitialization } from "../lib/db/demo-seed";
import { isValidDemoRequest } from "../lib/db/demo-control";
import { POST as executeRoute } from "../src/app/api/demo-control/execute/route";

const demoEnv = {
  DEMO_SEED_RESET_ENABLED: "true",
  DEMO_ENVIRONMENT: "demo",
  DEMO_SEED_SCHEMA: "LUMINAFORGE",
  BREAK_GLASS_GRANT_SECRET: "test-only-secret-that-is-at-least-32-characters",
};

test("demo reset configuration fails closed before pool access", async () => {
  assert.throws(() => getDemoSeedConfig({}), /disabled/);
  assert.throws(
    () =>
      getDemoSeedConfig({
        DEMO_SEED_RESET_ENABLED: "true",
        DEMO_ENVIRONMENT: "production",
        DEMO_SEED_SCHEMA: "LUMINAFORGE",
      }),
    /DEMO_ENVIRONMENT=demo/,
  );
  assert.throws(
    () =>
      getDemoSeedConfig({
        DEMO_SEED_RESET_ENABLED: "true",
        DEMO_ENVIRONMENT: "demo",
        DEMO_SEED_SCHEMA: "PRODUCTION",
      }),
    /exactly LUMINAFORGE/,
  );

  let poolAccessed = false;
  await assert.rejects(
    () =>
      executeDemoSeedInitialization({
        env: {},
        pool: {
          async getConnection() {
            poolAccessed = true;
            throw new Error("must not run");
          },
        },
      }),
    /disabled/,
  );
  assert.equal(poolAccessed, false);
});

test("break-glass grants reject expiration and tampering", () => {
  const now = Date.UTC(2027, 0, 1);
  const token = issueBreakGlassGrant("ops-lead", now, demoEnv);
  assert.equal(verifyBreakGlassGrant(token, now, demoEnv)?.sub, "ops-lead");
  assert.equal(verifyBreakGlassGrant(`${token}x`, now, demoEnv), null);
  assert.equal(verifyBreakGlassGrant(token, now + 6 * 60_000, demoEnv), null);
});

test("grant clearing expires the HttpOnly cookie", () => {
  const response = NextResponse.json({ ok: true });
  clearBreakGlassGrantCookie(response);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, new RegExp(`${BREAK_GLASS_COOKIE}=`));
  assert.match(cookie, /Max-Age=0/i);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=strict/i);
});

test("route rejects unknown and unauthorized actions before database access", async () => {
  assert.equal(
    isValidDemoRequest("luminaforge", "initialize-demo-seed-data"),
    true,
  );
  assert.equal(isValidDemoRequest("global", "raw-sql"), false);

  const invalid = new NextRequest("http://aegis.test/api/demo-control/execute", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "aegis.test",
      origin: "http://aegis.test",
    },
    body: JSON.stringify({ scope: "global", action: "raw-sql", sql: "DROP TABLE users" }),
  });
  assert.equal((await executeRoute(invalid)).status, 400);

  const unauthorized = new NextRequest(
    "http://aegis.test/api/demo-control/execute",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "aegis.test",
        origin: "http://aegis.test",
      },
      body: JSON.stringify({
        scope: "luminaforge",
        action: "initialize-demo-seed-data",
      }),
    },
  );
  assert.equal((await executeRoute(unauthorized)).status, 401);

  const crossOrigin = new NextRequest(
    "http://aegis.test/api/demo-control/execute",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "aegis.test",
        origin: "https://evil.example",
      },
      body: JSON.stringify({
        scope: "luminaforge",
        action: "initialize-demo-seed-data",
      }),
    },
  );
  assert.equal((await executeRoute(crossOrigin)).status, 403);
});

test("seed service commits once and explicitly closes on success", async () => {
  const calls: string[] = [];
  const connection = {
    async execute(sql: string) {
      calls.push(sql.startsWith("ALTER SESSION") ? "timezone" : "package");
      if (sql.startsWith("ALTER SESSION")) return {};
      return {
        outBinds: {
          anchor: "2027-03-31T12:34:56.789Z",
          users: 27,
          portfolio: 40,
          transactions: 42,
          luxury_items: 20,
        },
      };
    },
    async commit() {
      calls.push("commit");
    },
    async rollback() {
      calls.push("rollback");
    },
    async close() {
      calls.push("close");
    },
  };

  const result = await executeDemoSeedInitialization({
    env: demoEnv,
    pool: { async getConnection() { return connection as never; } },
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.counts, {
    users: 27,
    portfolio: 40,
    transactions: 42,
    luxuryItems: 20,
  });
  assert.deepEqual(calls, ["timezone", "package", "commit", "close"]);
});

test("seed service rolls back, closes, and redacts package errors", async () => {
  const calls: string[] = [];
  const secretText = "seed-password-must-not-leak";
  const connection = {
    async execute(sql: string) {
      calls.push(sql.startsWith("ALTER SESSION") ? "timezone" : "package");
      if (sql.startsWith("ALTER SESSION")) return {};
      throw new Error(`ORA-20061 validation failed ${secretText}`);
    },
    async commit() {
      calls.push("commit");
    },
    async rollback() {
      calls.push("rollback");
    },
    async close() {
      calls.push("close");
    },
  };

  const result = await executeDemoSeedInitialization({
    env: demoEnv,
    pool: { async getConnection() { return connection as never; } },
  });
  assert.equal(result.ok, false);
  assert.equal(result.rolledBack, true);
  assert.match(result.error ?? "", /validation failed.*ORA-20061/);
  assert.doesNotMatch(result.error ?? "", new RegExp(secretText));
  assert.deepEqual(calls, ["timezone", "package", "rollback", "close"]);
});

test("lock contention is reported without raw Oracle details", async () => {
  const connection = {
    async execute(sql: string) {
      if (sql.startsWith("ALTER SESSION")) return {};
      throw new Error(
        "ORA-20066: Demo seed initialization is already running internal bind data",
      );
    },
    async rollback() {},
    async close() {},
  };
  const result = await executeDemoSeedInitialization({
    env: demoEnv,
    pool: { async getConnection() { return connection as never; } },
  });
  assert.deepEqual(result, {
    ok: false,
    error: "Demo seed initialization is already running",
    rolledBack: true,
  });
});

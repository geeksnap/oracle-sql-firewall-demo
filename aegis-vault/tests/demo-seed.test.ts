import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";
import {
  BREAK_GLASS_COOKIE,
  clearBreakGlassGrantCookie,
  cookieSecure,
  issueBreakGlassGrant,
  setBreakGlassGrantCookie,
  verifyBreakGlassGrant,
} from "../lib/break-glass-grant";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDemoSeedConfig } from "../lib/demo-seed-config";
import { executeDemoSeedInitialization } from "../lib/db/demo-seed";
import { isValidDemoRequest } from "../lib/db/demo-control";
import { POST as executeRoute } from "../src/app/api/demo-control/execute/route";
import { POST as loginRoute } from "../src/app/api/break-glass/login/route";

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

test("grant cookies follow request scheme instead of NODE_ENV", () => {
  const httpReq = new NextRequest("http://161.33.154.45:3000/api/break-glass/login");
  const httpsReq = new NextRequest("https://aegis.test/api/break-glass/login");
  const forwarded = new NextRequest("http://aegis.test/api/break-glass/login", {
    headers: { "x-forwarded-proto": "https" },
  });
  assert.equal(cookieSecure(httpReq), false);
  assert.equal(cookieSecure(httpsReq), true);
  assert.equal(cookieSecure(forwarded), true);
  assert.equal(cookieSecure(httpReq, { AEGIS_COOKIE_SECURE: "true" }), true);
  assert.equal(cookieSecure(httpsReq, { AEGIS_COOKIE_SECURE: "false" }), false);

  const httpResponse = NextResponse.json({ ok: true });
  setBreakGlassGrantCookie(httpResponse, "token", httpReq);
  const httpCookie = httpResponse.headers.get("set-cookie") ?? "";
  assert.doesNotMatch(httpCookie, /Secure/i);

  const httpsResponse = NextResponse.json({ ok: true });
  setBreakGlassGrantCookie(httpsResponse, "token", httpsReq);
  const httpsCookie = httpsResponse.headers.get("set-cookie") ?? "";
  assert.match(httpsCookie, /Secure/i);
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
        confirmation: "RESET LUMINAFORGE DEMO DATA",
      }),
    },
  );
  const unauthorizedResponse = await executeRoute(unauthorized);
  assert.equal(unauthorizedResponse.status, 401);
  const unauthorizedBody = (await unauthorizedResponse.json()) as {
    error?: string;
    mutationAttempted?: boolean;
  };
  assert.equal(unauthorizedBody.error, "Break-glass authorization is required");
  assert.equal(unauthorizedBody.mutationAttempted, false);
  assert.doesNotMatch(
    JSON.stringify(unauthorizedBody),
    /Rollback could not be confirmed/i,
  );

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
        confirmation: "RESET LUMINAFORGE DEMO DATA",
      }),
    },
  );
  assert.equal((await executeRoute(crossOrigin)).status, 403);

  const prevSecret = process.env.BREAK_GLASS_GRANT_SECRET;
  process.env.BREAK_GLASS_GRANT_SECRET = "short";
  try {
    const misconfigured = new NextRequest(
      "http://aegis.test/api/demo-control/execute",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "aegis.test",
          origin: "http://aegis.test",
          cookie: `${BREAK_GLASS_COOKIE}=abc.def`,
        },
        body: JSON.stringify({
          scope: "luminaforge",
          action: "initialize-demo-seed-data",
          confirmation: "RESET LUMINAFORGE DEMO DATA",
        }),
      },
    );
    const misconfiguredResponse = await executeRoute(misconfigured);
    assert.equal(misconfiguredResponse.status, 503);
    const misconfiguredBody = (await misconfiguredResponse.json()) as {
      error?: string;
      mutationAttempted?: boolean;
    };
    assert.equal(
      misconfiguredBody.error,
      "Break-glass authorization is not configured",
    );
    assert.equal(misconfiguredBody.mutationAttempted, false);
    assert.doesNotMatch(
      JSON.stringify(misconfiguredBody),
      /BREAK_GLASS_GRANT_SECRET/,
    );
  } finally {
    if (prevSecret === undefined) delete process.env.BREAK_GLASS_GRANT_SECRET;
    else process.env.BREAK_GLASS_GRANT_SECRET = prevSecret;
  }
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

test("login without a configured secret does not leak env names", async () => {
  const prevEnabled = process.env.DEMO_SEED_RESET_ENABLED;
  const prevSecret = process.env.BREAK_GLASS_GRANT_SECRET;
  process.env.DEMO_SEED_RESET_ENABLED = "true";
  process.env.BREAK_GLASS_GRANT_SECRET = "short";
  try {
    const response = await loginRoute(
      new Request("http://aegis.test/api/break-glass/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "ops-lead", password: "demo" }),
      }),
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      seedGrantIssued?: boolean;
      error?: string;
    };
    assert.equal(body.seedGrantIssued, false);
    assert.doesNotMatch(JSON.stringify(body), /BREAK_GLASS_GRANT_SECRET/);
  } finally {
    if (prevEnabled === undefined) delete process.env.DEMO_SEED_RESET_ENABLED;
    else process.env.DEMO_SEED_RESET_ENABLED = prevEnabled;
    if (prevSecret === undefined) delete process.env.BREAK_GLASS_GRANT_SECRET;
    else process.env.BREAK_GLASS_GRANT_SECRET = prevSecret;
  }
});

test("ensure-demo-seed-env.sh upserts keys without printing the secret", () => {
  const dir = mkdtempSync(join(tmpdir(), "aegis-seed-env-"));
  const envPath = join(dir, ".env");
  writeFileSync(
    envPath,
    "DB_USER=AEGIS_APP\nDEMO_SEED_RESET_ENABLED=false\nBREAK_GLASS_GRANT_SECRET=replace-with-a-random-secret-at-deploy-time\n",
  );
  const script = join(import.meta.dirname, "../../scripts/ensure-demo-seed-env.sh");
  const stdout = execFileSync("bash", [script, envPath], { encoding: "utf8" });
  assert.match(stdout, /secret not printed/i);
  assert.doesNotMatch(stdout, /BREAK_GLASS_GRANT_SECRET=/);
  const first = readFileSync(envPath, "utf8");
  assert.match(first, /^DEMO_SEED_RESET_ENABLED=true$/m);
  assert.match(first, /^DEMO_ENVIRONMENT=demo$/m);
  assert.match(first, /^DEMO_SEED_SCHEMA=LUMINAFORGE$/m);
  const secret = first.match(/^BREAK_GLASS_GRANT_SECRET=(.+)$/m)?.[1] ?? "";
  assert.ok(secret.length >= 32);
  assert.notEqual(secret, "replace-with-a-random-secret-at-deploy-time");
  execFileSync("bash", [script, envPath], { encoding: "utf8" });
  const second = readFileSync(envPath, "utf8");
  assert.equal(
    second.match(/^BREAK_GLASS_GRANT_SECRET=(.+)$/m)?.[1],
    secret,
  );
});

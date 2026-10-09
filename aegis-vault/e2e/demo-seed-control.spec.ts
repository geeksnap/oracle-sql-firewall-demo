import { expect, test } from "@playwright/test";

test("authorized presenter confirms one reset without navigating", async ({
  page,
  request,
}) => {
  let resetRequests = 0;
  await page.route("**/api/build", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ build: 78 }),
    }),
  );
  await page.route("**/api/break-glass/login", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        seedGrantIssued: true,
        violation: { id: "test-break-glass" },
      }),
    }),
  );
  await page.route("**/api/demo-control/execute", async (route) => {
    resetRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        seedAnchor: "2027-03-31T12:34:56.789Z",
        seedCounts: {
          users: 27,
          portfolio: 40,
          transactions: 42,
          luxuryItems: 20,
        },
        rolledBack: false,
      }),
    });
  });

  await page.goto("/");
  const dashboard = page.getByRole("button", { name: "Dashboard" });
  const dashboardClass = await dashboard.getAttribute("class");

  const seedButton = page.getByRole("button", {
    name: "Initialize Demo Seed Data",
  });
  await expect(seedButton).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Break-Glass Control" }),
  ).toBeVisible();

  await seedButton.click();
  await page.getByLabel("Break-Glass User").fill("ops-lead");
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: "Break-Glass Login" }).click();

  const confirmation = page.getByLabel(
    "Type RESET LUMINAFORGE DEMO DATA to continue",
  );
  await expect(confirmation).toBeVisible();
  await expect(page.getByText("LUMINAFORGE.USERS", { exact: true })).toBeVisible();
  await confirmation.fill("RESET LUMINAFORGE DEMO DATA");

  const replace = page.getByRole("button", { name: "Replace Demo Data" });
  await replace.dblclick();
  await expect(page.getByText("Demo seed initialization committed.")).toBeVisible();
  expect(resetRequests).toBe(1);
  expect(await dashboard.getAttribute("class")).toBe(dashboardClass);
  await expect(page.getByText("USERS=27")).toBeVisible();

  const denied = await request.post("/api/demo-control/execute", {
    headers: {
      origin: "http://127.0.0.1:3100",
      host: "127.0.0.1:3100",
    },
    data: {
      scope: "luminaforge",
      action: "initialize-demo-seed-data",
    },
  });
  expect(denied.status()).toBe(401);
});

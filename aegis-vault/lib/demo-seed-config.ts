export interface DemoSeedConfig {
  enabled: true;
  targetSchema: "LUMINAFORGE";
}

export type DemoSeedEnvironment = Record<string, string | undefined>;

export function getDemoSeedConfig(
  env: DemoSeedEnvironment = process.env,
): DemoSeedConfig {
  if (env.DEMO_SEED_RESET_ENABLED !== "true") {
    throw new Error("Demo seed initialization is disabled");
  }
  if (env.DEMO_ENVIRONMENT !== "demo") {
    throw new Error("Demo seed initialization requires DEMO_ENVIRONMENT=demo");
  }
  if ((env.DEMO_SEED_SCHEMA ?? "").trim().toUpperCase() !== "LUMINAFORGE") {
    throw new Error("Demo seed target must be exactly LUMINAFORGE");
  }
  return { enabled: true, targetSchema: "LUMINAFORGE" };
}

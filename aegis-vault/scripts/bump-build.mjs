#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "..", "build-info.json");
const info = JSON.parse(readFileSync(path, "utf8"));
info.build = (info.build ?? 0) + 1;
info.builtAt = new Date().toISOString();
writeFileSync(path, `${JSON.stringify(info, null, 2)}\n`);
console.log(`[aegis-vault] build ${info.build}`);

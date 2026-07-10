#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const runStep = join(__dir, "run-step.mjs");

function pendingCount() {
  const meta = JSON.parse(readFileSync(join(__dir, "tasks.json"), "utf8"));
  return meta.tasks.filter((t) => t.status !== "done").length;
}

let n = 0;
while (pendingCount() > 0) {
  n++;
  console.log(`\n========== batch run #${n} ==========\n`);
  const r = spawnSync(process.execPath, [runStep, "--next"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: 600000,
  });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  if (r.status !== 0) {
    console.error(`Step failed with exit ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

console.log("\n========== ALL DONE ==========\n");
spawnSync(process.execPath, [runStep, "--status"], { encoding: "utf8", stdio: "inherit" });

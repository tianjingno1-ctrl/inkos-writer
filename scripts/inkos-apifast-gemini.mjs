#!/usr/bin/env node
/**
 * 用 apifast · gemini-2.5-pro 跑任意 inkos CLI 子命令。
 * 用法：node scripts/inkos-apifast-gemini.mjs write next <bookId> [--context "..."]
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

function loadApifastKey() {
  if (process.env.INKOS_APIFAST_KEY?.trim()) {
    return process.env.INKOS_APIFAST_KEY.trim();
  }
  if (!existsSync(envPath)) return null;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^INKOS_APIFAST_KEY=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const apiKey = loadApifastKey();
if (!apiKey) {
  console.error("INKOS_APIFAST_KEY missing in .env");
  process.exit(1);
}

const inkosEntry = join(root, "packages/cli/dist/index.js");
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/inkos-apifast-gemini.mjs <inkos-subcommand> [...args]");
  process.exit(1);
}

const env = {
  ...process.env,
  INKOS_LLM_PROVIDER: "custom",
  INKOS_LLM_SERVICE: "apifast",
  INKOS_LLM_BASE_URL: "https://api.apifast.tech/v1",
  INKOS_LLM_MODEL: "gemini-2.5-pro",
  INKOS_LLM_API_KEY: apiKey,
};

const result = spawnSync(process.execPath, [inkosEntry, ...args], {
  cwd: root,
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);

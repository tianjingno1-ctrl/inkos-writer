#!/usr/bin/env node
/**
 * 用 tongapi · gpt-5.4 跑任意 inkos CLI 子命令。
 * 用法与 apifast 脚本相同，只换文件名：
 *   node scripts/inkos-tongapi.mjs plan chapter <bookId> --context-file "..."
 *   node scripts/inkos-tongapi.mjs write next <bookId> --words 2600 --context-file "..." --context "..."
 *
 * 换回 Gemini：改用 node scripts/inkos-apifast-gemini.mjs ...
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

function readEnvValue(name) {
  if (process.env[name]?.trim()) {
    return process.env[name].trim();
  }
  if (!existsSync(envPath)) return null;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(new RegExp(`^${name}=(.*)$`));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

function loadTongapiKey() {
  return (
    readEnvValue("INKOS_TONGAPI_KEY") ||
    readEnvValue("INKOS_LLM_API_KEY") ||
    null
  );
}

const apiKey = loadTongapiKey();
if (!apiKey) {
  console.error("INKOS_TONGAPI_KEY (or INKOS_LLM_API_KEY) missing in .env");
  process.exit(1);
}

const inkosEntry = join(root, "packages/cli/dist/index.js");
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/inkos-tongapi.mjs <inkos-subcommand> [...args]");
  process.exit(1);
}

// 默认 gpt-5.4；临时换模：INKOS_TONGAPI_MODEL=gpt-5.5 node scripts/inkos-tongapi.mjs ...
const model =
  process.env.INKOS_TONGAPI_MODEL?.trim() ||
  readEnvValue("INKOS_TONGAPI_MODEL") ||
  "gpt-5.4";

const env = {
  ...process.env,
  INKOS_LLM_PROVIDER: "custom",
  INKOS_LLM_SERVICE: "tongapi",
  INKOS_LLM_BASE_URL: "https://tongapi.com/v1",
  INKOS_LLM_MODEL: model,
  INKOS_LLM_API_FORMAT: "chat",
  INKOS_LLM_API_KEY: apiKey,
  INKOS_TONGAPI_KEY: apiKey,
};

console.error(`[inkos-tongapi] model=${model}`);

const result = spawnSync(process.execPath, [inkosEntry, ...args], {
  cwd: root,
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);

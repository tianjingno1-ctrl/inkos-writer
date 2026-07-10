#!/usr/bin/env node
/** Load INKOS_APIFAST_KEY → INKOS_LLM_API_KEY and run inkos short run (gemini-2.5-pro). */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^INKOS_APIFAST_KEY=(.*)$/);
    if (m) {
      process.env.INKOS_LLM_API_KEY = m[1].trim().replace(/^["']|["']$/g, "");
      break;
    }
  }
}
if (!process.env.INKOS_LLM_API_KEY) {
  console.error("INKOS_APIFAST_KEY missing in project .env");
  process.exit(1);
}

process.env.INKOS_LLM_BASE_URL = "https://api.apifast.tech/v1";
process.env.INKOS_LLM_MODEL = "gemini-2.5-pro";

const inkosEntry = join(root, "packages/cli/dist/index.js");
const result = spawnSync(process.execPath, [
  inkosEntry,
  "short", "run",
  "--direction", "女频短篇 点众番茄 世情复仇打脸 护女母亲 春节返程高速 老公一家把五岁女儿挂车外狗笼 法律舆论反杀 记录仪高速交警哥哥 结尾对比女主过得很好 不原谅",
  "--reference", "shorts/.brief/春节返程-女儿挂狗笼.md",
  "--story-id", "春节返程-女儿挂狗笼",
  "--chapters", "12",
  "--chars", "1000",
  "--no-cover",
  "--model", "gemini-2.5-pro",
  "--llm-base-url", "https://api.apifast.tech/v1",
], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);

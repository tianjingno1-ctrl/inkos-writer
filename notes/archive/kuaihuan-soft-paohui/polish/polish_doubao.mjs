#!/usr/bin/env node
/**
 * @deprecated 请用 polish_llm.mjs（多模型轮换）。本脚本保留兼容，仍读 DOUBAO_MODEL。
 * 用法：node polish/polish_doubao.mjs 6-8  →  建议改为 node polish/polish_llm.mjs 6-8
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const arg = process.argv[2] ?? "6-8";
const env = { ...process.env };
if (process.env.DOUBAO_MODEL) env.POLISH_MODEL = process.env.DOUBAO_MODEL;

const r = spawnSync(process.execPath, [join(here, "polish_llm.mjs"), arg], {
  stdio: "inherit",
  env,
});
process.exit(r.status ?? 1);

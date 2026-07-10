#!/usr/bin/env node
/**
 * 打印 InkOS Agent 路由 + 润色轮换预览
 * 用法：node polish/show-routing.mjs [起始章] [结束章]
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getProvider, pickPolishModel } from "./resolve-provider.mjs";

const bookDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(bookDir, "..", "..");
const cfg = JSON.parse(readFileSync(join(bookDir, "polish", "polish-models.json"), "utf8"));
const ink = JSON.parse(readFileSync(join(repoRoot, "inkos.json"), "utf8"));

const provider = getProvider(cfg);
const AGENT_LABEL = {
  writer: "写草稿",
  auditor: "审计",
  reviser: "修订",
  architect: "大纲",
  "chapter-analyzer": "状态提取",
  radar: "后台扫描",
};

console.log("=== InkOS write next（每章内部多 Agent）===\n");
console.log(`路由：${provider}${provider === "omniroute" ? " → " + cfg.omniroute.apiBase : ""}`);
console.log(`默认：${ink.llm?.model ?? "?"}`);
for (const [agent, model] of Object.entries(ink.modelOverrides ?? {})) {
  console.log(`  ${agent.padEnd(18)} ${AGENT_LABEL[agent] ?? ""} → ${model}`);
}

console.log("\n=== 润色 polish_llm（按章轮换）===\n");
console.log(`provider：${provider}`);
console.log(`轮换：${cfg.polish.rotation.join(" → ")}`);
console.log(`关键章 ${cfg.polish.keyChapters.chapters.join(",")}：${cfg.polish.keyChapters.models.join(" / ")}`);
if (cfg.disabled?.length) {
  console.log(`今日禁用（方舟 ID）：${cfg.disabled.join(", ")}`);
}

const from = parseInt(process.argv[2] ?? "31", 10);
const to = parseInt(process.argv[3] ?? String(from), 10);
console.log(`\n预览 第${from}–${to} 章润色模型：`);
for (let n = from; n <= to; n++) {
  const m = pickPolishModel(cfg, n);
  const tag = cfg.polish.keyChapters.chapters.includes(n) ? " [关键章]" : "";
  console.log(`  第${n}章 → ${m}${tag}`);
}

if (provider === "omniroute") {
  console.log("\nOmniRoute 映射（逻辑键 → 请求 model）：");
  for (const [key, omniId] of Object.entries(cfg.omniroute.modelMap)) {
    console.log(`  ${key.padEnd(10)} ${cfg.models[key] ?? "?"} → ${omniId}`);
  }
}

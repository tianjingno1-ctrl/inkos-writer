#!/usr/bin/env node
/**
 * 将 polish-models.json 里的 InkOS 路由写入仓库根 inkos.json
 * 用法（在本书目录）：node polish/apply-inkos-routing.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getApiBase, getProvider, toRequestModel } from "./resolve-provider.mjs";

const bookDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(bookDir, "..", "..");
const routingPath = join(bookDir, "polish", "polish-models.json");
const inklosPath = join(repoRoot, "inkos.json");

const cfg = JSON.parse(readFileSync(routingPath, "utf8"));
const ink = JSON.parse(readFileSync(inklosPath, "utf8"));
const { models, inkos: route } = cfg;
const provider = getProvider(cfg);

const defaultId = toRequestModel(cfg, provider, models[route.default]);
if (!defaultId) throw new Error(`unknown default key: ${route.default}`);

ink.llm = ink.llm ?? {};
ink.llm.service = provider === "omniroute" ? "custom" : route.service;
ink.llm.baseUrl = getApiBase(cfg, provider);
ink.llm.model = defaultId;
ink.llm.defaultModel = defaultId;

if (Array.isArray(ink.llm.services) && ink.llm.services[0]) {
  ink.llm.services[0].baseUrl = ink.llm.baseUrl;
  if (provider === "omniroute") {
    ink.llm.services[0].name = "omniroute-local";
  }
}

const overrides = {};
for (const [agent, key] of Object.entries(route.overrides)) {
  const id = toRequestModel(cfg, provider, models[key]);
  if (!id) throw new Error(`unknown model key "${key}" for agent ${agent}`);
  overrides[agent] = id;
}
ink.modelOverrides = overrides;

writeFileSync(inklosPath, JSON.stringify(ink, null, 2) + "\n", "utf8");

console.log("Updated", inklosPath);
console.log("  provider:", provider);
console.log("  baseUrl:", ink.llm.baseUrl);
console.log("  default:", defaultId);
for (const [a, m] of Object.entries(overrides)) {
  console.log(`  ${a} → ${m}`);
}

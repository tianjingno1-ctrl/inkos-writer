import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function expandHome(p) {
  return p.startsWith("~/") ? join(homedir(), p.slice(2)) : p;
}

export function getProvider(cfg) {
  return process.env.POLISH_PROVIDER ?? cfg.provider ?? "ark";
}

export function resolveModelKey(cfg, keyOrId) {
  return cfg.models[keyOrId] ?? keyOrId;
}

export function toRequestModel(cfg, provider, keyOrId) {
  const arkId = resolveModelKey(cfg, keyOrId);
  if (provider !== "omniroute") return arkId;
  const map = cfg.omniroute?.modelMap ?? {};
  for (const [key, omniId] of Object.entries(map)) {
    if (cfg.models[key] === arkId) return omniId;
  }
  if (arkId.includes("/")) return arkId;
  return `doubao/${arkId}`;
}

export function getApiBase(cfg, provider = getProvider(cfg)) {
  if (provider === "omniroute") {
    return process.env.OMNIROUTE_API_BASE ?? cfg.omniroute?.apiBase ?? "http://127.0.0.1:20128/v1";
  }
  return process.env.VOLCENGINE_ARK_API_BASE ?? cfg.apiBase;
}

export function getApiKey(cfg, provider = getProvider(cfg)) {
  if (provider === "omniroute") {
    const env = process.env.OMNIROUTE_API_KEY ?? process.env.POLISH_API_KEY;
    if (env) return env.trim();
    const file = cfg.omniroute?.apiKeyFile;
    if (file) {
      const path = expandHome(file);
      if (existsSync(path)) return readFileSync(path, "utf8").trim();
    }
    return "";
  }
  return (
    process.env.VOLCENGINE_ARK_API_KEY ??
    readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim()
  );
}

export function pickPolishModelKey(cfg, chNum) {
  if (process.env.POLISH_MODEL) {
    const raw = process.env.POLISH_MODEL;
    for (const [key, id] of Object.entries(cfg.models)) {
      if (raw === key || raw === id) return key;
    }
    return raw;
  }
  const keyCfg = cfg.polish.keyChapters;
  if (keyCfg?.chapters?.includes(chNum)) {
    const keys = keyCfg.models;
    return keys[chNum % keys.length];
  }
  const rot = cfg.polish.rotation;
  return rot[(chNum - 1) % rot.length];
}

export function pickPolishModel(cfg, chNum) {
  const provider = getProvider(cfg);
  const blocked = cfg.disabled ?? [];

  if (process.env.POLISH_MODEL) {
    const raw = process.env.POLISH_MODEL;
    const arkId = resolveModelKey(cfg, raw);
    if (blocked.includes(arkId)) {
      throw new Error(`模型 ${arkId} 已在 polish-models.json disabled 列表中，请换模型或从 disabled 移除`);
    }
    return raw.includes("/") ? raw : toRequestModel(cfg, provider, raw);
  }

  const key = pickPolishModelKey(cfg, chNum);
  const arkId = resolveModelKey(cfg, key);
  if (blocked.includes(arkId)) {
    throw new Error(`模型 ${arkId} 已在 polish-models.json disabled 列表中，请换模型或从 disabled 移除`);
  }
  return toRequestModel(cfg, provider, key);
}

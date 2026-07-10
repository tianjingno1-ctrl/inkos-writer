#!/usr/bin/env node
/**
 * 多模型润色（火山方舟 OpenAI 兼容）：按 polish-models.json 轮换，避免单模型额度耗尽。
 * 用法：node polish/polish_llm.mjs 31|31-33
 * 覆盖：POLISH_MODEL=doubao-seed-2-1-pro-260628 node polish/polish_llm.mjs 31
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const BOOK = join(__dir, "..");
const CH_DIR = join(BOOK, "chapters");
const OUT_DIR = join(__dir, "out-llm");
const PRE_DIR = join(__dir, "pre-llm");
const INDEX = join(CH_DIR, "index.json");
const ROUTING = join(__dir, "polish-models.json");

import { getApiBase, getApiKey, getProvider, pickPolishModel } from "./resolve-provider.mjs";

const cfg = JSON.parse(readFileSync(ROUTING, "utf8"));

const provider = getProvider(cfg);
const KEY = getApiKey(cfg, provider);
const API = getApiBase(cfg, provider);
const INSTRUCTION = process.env.POLISH_INSTRUCTION ?? cfg.polish.instruction;

function findChapterFile(num) {
  const prefix = String(num).padStart(4, "0") + "_";
  const files = readdirSync(CH_DIR).filter((f) => f.startsWith(prefix) && f.endsWith(".md"));
  if (files.length === 0) throw new Error(`chapter ${num} not found`);
  if (files.length === 1) return join(CH_DIR, files[0]);

  const index = JSON.parse(readFileSync(INDEX, "utf8"));
  const row = index.find((r) => r.number === num);
  if (row?.title) {
    const byName = files.find((f) => f.includes(row.title));
    if (byName) return join(CH_DIR, byName);
    for (const f of files) {
      const head = readFileSync(join(CH_DIR, f), "utf8").match(/^#\s*第\d+章\s*(.+?)\s*\n/);
      if (head?.[1]?.trim() === row.title) return join(CH_DIR, f);
    }
  }
  throw new Error(`chapter ${num} ambiguous (${files.length} files): ${files.join(", ")}`);
}

function parseChapter(text) {
  const m = text.match(/^#\s*第\d+章\s*(.+?)\s*\n([\s\S]*)/);
  if (!m) throw new Error("invalid chapter format");
  return { title: m[1].trim(), body: m[2].trim() };
}

function zhCharCount(body) {
  return body.replace(/\s/g, "").length;
}

function cleanOutput(raw) {
  let t = raw.trim();
  t = t.replace(/^```(?:markdown|md)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  t = t.replace(/^#\s*第\d+章[^\n]*\n+/, "");
  return t.trim();
}

async function polish(num) {
  const model = pickPolishModel(cfg, num);
  const path = findChapterFile(num);
  const raw = readFileSync(path, "utf8");
  const { title, body } = parseChapter(raw);

  mkdirSync(PRE_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });
  const base = path.split(/[/\\]/).pop();
  const prePath = join(PRE_DIR, base);
  if (!existsSync(prePath)) writeFileSync(prePath, raw, "utf8");

  const user = `${body}\n\n${INSTRUCTION}`;
  writeFileSync(join(OUT_DIR, `prompt-${String(num).padStart(4, "0")}.txt`), user, "utf8");

  console.log(`→ ch${num} [${provider}] ${model} …`);
  const t0 = Date.now();
  const res = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是网文润色编辑。只输出润色后正文，不要标题、不要解释、不要代码块。不改剧情走向和【叮！】系统弹窗数字。",
        },
        { role: "user", content: user },
      ],
      temperature: 0.72,
      max_tokens: 8192,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 600)}`);
  const json = JSON.parse(text);
  if (json.error) throw new Error(JSON.stringify(json.error));
  const content = cleanOutput(json.choices?.[0]?.message?.content ?? "");
  if (!content) throw new Error("empty response");

  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  const polished = `# 第${num}章 ${title}\n\n${content}\n`;
  writeFileSync(join(OUT_DIR, base), polished, "utf8");
  writeFileSync(
    join(OUT_DIR, `meta-${String(num).padStart(4, "0")}.json`),
    JSON.stringify({ chapter: num, title, model, elapsedSec: +sec, zhChars: zhCharCount(content) }, null, 2),
    "utf8",
  );
  writeFileSync(path, polished, "utf8");

  const index = JSON.parse(readFileSync(INDEX, "utf8"));
  const now = new Date().toISOString();
  for (const row of index) {
    if (row.number === num) {
      row.wordCount = zhCharCount(content);
      row.updatedAt = now;
      break;
    }
  }
  writeFileSync(INDEX, JSON.stringify(index, null, 2) + "\n", "utf8");

  console.log(`OK ch${num} ${sec}s · ${zhCharCount(content)}字 · ${model} → ${base}`);
}

function parseArgs() {
  const arg = process.argv[2] ?? "6-8";
  if (arg.includes("-")) {
    const [a, b] = arg.split("-").map((x) => parseInt(x, 10));
    const out = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }
  return [parseInt(arg, 10)];
}

const nums = parseArgs();
const delay = cfg.polish.delayMs ?? 2000;
const used = [];
for (let i = 0; i < nums.length; i++) {
  const model = pickPolishModel(cfg, nums[i]);
  used.push({ chapter: nums[i], model, provider });
  await polish(nums[i]);
  if (i < nums.length - 1) await new Promise((r) => setTimeout(r, delay));
}

console.log(`\n── 本章润色 (${provider}) ──`);
for (const { chapter, model } of used) {
  console.log(`  第${chapter}章 → ${model}`);
}

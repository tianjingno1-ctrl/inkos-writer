#!/usr/bin/env node
/**
 * 按章扩写番茄稿至 ~10000 字，保留 01.~10. 格式
 * 用法：node run-fanqie-expand-chapters.mjs [章号|起 止|all]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const KEY =
  process.env.VOLCENGINE_ARK_API_KEY ??
  readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
const MODEL = process.env.DOUBAO_MODEL ?? "doubao-seed-2-0-pro-260215";
const API = process.env.VOLCENGINE_ARK_API_BASE ?? "https://ark.cn-beijing.volces.com/api/v3";

const SRC = join(__dir, "fanqie-rewrite.md");
const REF = join(__dir, "full-polished.md");
const OUT_DIR = join(__dir, "expand-chapters");
const OUT_TXT = join(__dir, "白月光回国那晚-我终止了替身契约-番茄改写.txt");
const OUT_MD = join(__dir, "fanqie-rewrite-10k.md");

const TARGET_TOTAL = 10000;
const TARGET_PER_CH = parseInt(process.env.TARGET_PER_CH || "1000", 10);

const han = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;

function parseFanqieMd(raw) {
  const text = raw
    .replace(/^#.*\n+/m, "")
    .replace(/^>.*\n+/gm, "")
    .replace(/^---\n+/gm, "")
    .replace(/^##\s*书籍简介\s*\n/m, "")
    .replace(/^##\s*开篇钩子\s*\n/m, "---\n")
    .trim();

  const hookSplit = text.split(/\n---\n/);
  const intro = hookSplit[0].trim();
  const rest = hookSplit.slice(1).join("\n---\n").trim();
  const hookEnd = rest.search(/\n01\.\n/);
  const hook = hookEnd >= 0 ? rest.slice(0, hookEnd).trim() : "";
  const body = hookEnd >= 0 ? rest.slice(hookEnd + 1) : rest;

  const chapters = new Map();
  const parts = body.split(/\n(?=\d{2}\.\n)/);
  for (const part of parts) {
    const m = part.match(/^(\d{2})\.\n([\s\S]*)/);
    if (!m) continue;
    chapters.set(parseInt(m[1], 10), m[2].trim());
  }
  return { intro, hook, chapters };
}

const BRIEF = `在不改变本章剧情节点、人物关系的前提下，将本章扩写到约${TARGET_PER_CH}汉字。
文风：番茄女频追妻火葬场，短句短段，一段最多三行，对话口语有张力，章末留钩子。
只输出以下格式，不加解释：
NN.
（扩写后正文）`;

async function expandChapter(num, body, refSnippet) {
  const pad = String(num).padStart(2, "0");
  const cur = han(body);
  const need = Math.max(200, TARGET_PER_CH - cur);
  const user = `${BRIEF.replace(/NN/g, pad)}\n\n【当前第${num}章 · ${cur}字，需增补约${need}字】\n\n${pad}.\n${body}\n\n【母版参考片段（可补细节，勿改本章主线）】\n${refSnippet}`;

  const res = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "你是番茄女频短篇写手。只输出扩写后的单章正文，格式以 NN. 开头。",
        },
        { role: "user", content: user },
      ],
      temperature: 0.75,
      max_tokens: 4096,
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`ch${pad} HTTP ${res.status} ${raw.slice(0, 400)}`);
  const json = JSON.parse(raw);
  let content = (json.choices?.[0]?.message?.content ?? "").trim();
  const head = content.match(new RegExp(`^${pad}\\.\\s*\\n?([\\s\\S]*)`));
  if (head) content = head[1].trim();
  return { content, chars: han(content), sec: 0 };
}

function chapterRange(argv) {
  const a = argv[2];
  const b = argv[3];
  if (!a || a === "all") return [...Array(10)].map((_, i) => i + 1);
  if (b && /^\d+$/.test(a) && /^\d+$/.test(b)) {
    const out = [];
    for (let i = parseInt(a, 10); i <= parseInt(b, 10); i++) out.push(i);
    return out;
  }
  if (/^\d+$/.test(a)) return [parseInt(a, 10)];
  return [...Array(10)].map((_, i) => i + 1);
}

function refForChapter(refText, num) {
  const markers = [...refText.matchAll(/^## 第(\d+)章[^\n]*/gm)].map((m) => ({
    n: parseInt(m[1], 10),
    i: m.index,
  }));
  if (!markers.length) return refText.slice(0, 1500);
  const idx = markers.findIndex((m) => m.n === num);
  if (idx < 0) return refText.slice(0, 1500);
  const start = markers[idx].i;
  const end = idx + 1 < markers.length ? markers[idx + 1].i : refText.length;
  return refText.slice(start, Math.min(start + 2000, end)).trim();
}

const raw = readFileSync(SRC, "utf8");
const refText = readFileSync(REF, "utf8").replace(/^#.*\n\n?/m, "");
const { intro, hook, chapters } = parseFanqieMd(raw);
mkdirSync(OUT_DIR, { recursive: true });

const nums = chapterRange(process.argv);
const expanded = new Map();

// load existing expanded chapters if present
for (let i = 1; i <= 10; i++) {
  const p = join(OUT_DIR, `ch${String(i).padStart(2, "0")}.md`);
  try {
    const c = readFileSync(p, "utf8").trim();
    if (c) expanded.set(i, c);
  } catch {}
}

for (const ch of nums) {
  if (!chapters.has(ch)) throw new Error(`missing chapter ${ch}`);
  const pad = String(ch).padStart(2, "0");
  console.log(`→ ch${pad} expand (${han(chapters.get(ch))} → ~${TARGET_PER_CH})`);
  const t0 = Date.now();
  const { content, chars } = await expandChapter(ch, chapters.get(ch), refForChapter(refText, ch));
  expanded.set(ch, content);
  writeFileSync(join(OUT_DIR, `ch${pad}.md`), content + "\n", "utf8");
  console.log(`OK ch${pad} ${chars}字 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

const parts = [intro, "", "---", "", hook, "", "---", ""];
for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, "0");
  parts.push(`${pad}.`, expanded.get(i) ?? chapters.get(i), "", "");
}
parts.push("（全文完）");

const txtBody = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
writeFileSync(OUT_TXT, txtBody, "utf8");

const header = `# 白月光回国那晚，我终止了替身契约 · 番茄改写 10k\n\n> 模型：\`${MODEL}\`\n> 按章扩写\n> 字数：${han(txtBody)} 汉字\n\n---\n\n`;
writeFileSync(OUT_MD, header + txtBody, "utf8");

console.log("TOTAL han:", han(txtBody));
console.log("Saved", OUT_TXT);

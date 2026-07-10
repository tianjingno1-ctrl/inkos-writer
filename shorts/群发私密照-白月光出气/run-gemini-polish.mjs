#!/usr/bin/env node
/** Gemini 2.5 Pro via apifast：黑岩一句一段润色，按 ###N. 分批 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "../..");
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const API_KEY = process.env.INKOS_APIFAST_KEY;
const BASE = "https://api.apifast.tech/v1";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";

const start = parseInt(process.argv[2] ?? "1", 10);
const end = parseInt(process.argv[3] ?? String(start + 4), 10);

const SYSTEM = `你是黑岩女频短篇润色编辑。只润色 prose，不改剧情、不改人名、不改法律事实与时间线（14分钟删帖、区块链存证等必须保留）。

硬性格式：
- 保留每个 ###数字. 小节标题，数字不变、顺序不变
- 黑岩体：一句一段，段间空一行
- 第一人称「我」，对话用「」
- 禁止：然而、与此同时、不可否认、章末总结升华、ESG、破折号——、省略号……
- 禁止合并或删除 ### 小节
- 只输出润色后正文，不要解释`;

const BRIEF = `润色目标：口语更狠、情绪更密、去 AI 味；律师女主保持冷、专业、不圣母；对话短、有潜台词。`;

function parseSections(text) {
  const re = /^###(\d+)\.\s*$/gm;
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null) hits.push({ num: parseInt(m[1], 10), index: m.index });
  const preamble = hits[0]?.index > 0 ? text.slice(0, hits[0].index).trim() : "";
  const sections = [];
  for (let i = 0; i < hits.length; i++) {
    const startIdx = hits[i].index;
    const endIdx = i + 1 < hits.length ? hits[i + 1].index : text.length;
    const block = text.slice(startIdx, endIdx).trim();
    sections.push({ num: hits[i].num, block });
  }
  return { preamble, sections };
}

const inputPath = join(__dir, "final/full.md");
const raw = readFileSync(inputPath, "utf8").replace(/\r\n/g, "\n");
const { preamble, sections } = parseSections(raw);
const selected = sections.filter((s) => s.num >= start && s.num <= end);
if (selected.length === 0) {
  console.error(`No sections ${start}-${end}`);
  process.exit(1);
}

const user = `${BRIEF}\n\n${selected.map((s) => s.block).join("\n\n")}`;

const payload = {
  model: MODEL,
  messages: [
    { role: "system", content: SYSTEM },
    { role: "user", content: user },
  ],
  temperature: 0.75,
  max_tokens: 16384,
};

const t0 = Date.now();
const res = await fetch(`${BASE}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
const json = await res.json();
if (!res.ok || json.error) throw new Error(JSON.stringify(json.error ?? json));

const content = (json.choices?.[0]?.message?.content ?? "").trim();
const usage = json.usage ?? {};

const outDir = join(__dir, "polish");
mkdirSync(outDir, { recursive: true });
const pad = (n) => String(n).padStart(2, "0");
const outPath = join(outDir, `sec${pad(start)}-${pad(end)}-gemini25.md`);
writeFileSync(outPath, content + "\n", "utf8");

const metaPath = join(outDir, `sec${pad(start)}-${pad(end)}-gemini25.meta.json`);
writeFileSync(metaPath, JSON.stringify({ usage, model: MODEL, elapsed_ms: Date.now() - t0 }, null, 2));

console.log("OK", outPath, `${((Date.now() - t0) / 1000).toFixed(1)}s`, JSON.stringify(usage));

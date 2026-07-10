#!/usr/bin/env node
/** 豆包 Pro：短语 + 正文，每次两章 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dir = dirname(fileURLToPath(import.meta.url));

const FORMAT_EXAMPLE = `第1章 小团体里的汉子茶(1)

【我们要在一起早在一起了，还有你什么事你在闹什么？】

那天晚上，喝多了。

温枝宁记不清跟谁在一张床上，只知道对方技术生疏又只会埋头猛……

汗水滴落被单晕染开。

温枝宁迷糊中睁开眼，唇瓣下一秒就被人咬着缠绵吻着。

"准备……"他低声难得耐心的哄了几下，声音让温枝宁感到格外耳熟。

"你输了，去问对面那个穿白色衣服的女的电话，没拿到你就老实喝吧。"

酒吧里，年轻男女随着音乐舞动着，玩游戏的玩游戏，搞在一起的已经动起手。`;

const DEFAULT_BRIEF =
  "在不改变剧情的情况下，可以加一些炸裂的点或者把一些句子，描述，文风换成更适合番茄女频的，然后用对白的感觉吧";

const FORMAT_BRIEF = `剧情不变。只调整句式和分段，更适合手机刷读：短段混对白，自然分段。不要加章首【】预告金句；开篇钩子除外。参考节奏：

${FORMAT_EXAMPLE}`;

const KEY =
  process.env.VOLCENGINE_ARK_API_KEY ??
  readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
const MODEL = process.env.DOUBAO_MODEL ?? "doubao-seed-2-0-pro-260215";

const start = parseInt(process.argv[2] ?? "1", 10);
const end = parseInt(process.argv[3] ?? String(start + 1), 10);
const mode = process.argv[4] === "format" ? "format" : "polish";
const briefArg = mode === "format" ? process.argv.slice(5) : process.argv.slice(4);
const BRIEF = briefArg.join(" ") || (mode === "format" ? FORMAT_BRIEF : DEFAULT_BRIEF);

const inputRel =
  process.env.DOUBAO_INPUT ??
  (mode === "format" ? "polish/all-doubao-pro.md" : "../temp-revised-story-final.md");
const inputPath = join(__dir, inputRel);
const raw = readFileSync(inputPath, "utf8").replace(/\r\n/g, "\n");
const body = raw.includes("## 正文\n") ? (raw.match(/## 正文\n([\s\S]*)/)?.[1] ?? "") : raw;

const numMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

function parseChapters(text) {
  const re = /\n#{2,3} (?:【)?第(.{1,3})章[ \u3000]([^\n】]+)(?:】)?/g;
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    hits.push({ index: m.index, num: numMap[m[1]] ?? parseInt(m[1], 10), title: m[2].trim() });
  }
  if (hits.length === 0) return [];

  const chapters = [];
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index;
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    const block = text.slice(start, end);
    const bodyMatch = block.match(/\n([\s\S]*)/);
    let content = (bodyMatch?.[1] ?? "").replace(/^---\n?/, "").replace(/\n---\s*$/, "").trim();
    if (hits[i].num === 1 && hits[0].index > 0) {
      const preamble = text.slice(0, hits[0].index).trim();
      if (preamble) content = `${preamble}\n\n${content}`;
    }
    chapters.push({ num: hits[i].num, title: hits[i].title, content });
  }
  return chapters;
}

const selected = parseChapters(body).filter((c) => c.num >= start && c.num <= end);
if (selected.length === 0) {
  console.error(`No chapters ${start}-${end} in ${inputPath}`);
  process.exit(1);
}

const text = selected.map((c) => `第${c.num}章 ${c.title}\n\n${c.content}`).join("\n\n---\n\n");
const user = `${BRIEF}\n\n${text}`;

const payload = JSON.stringify({
  model: MODEL,
  messages: [{ role: "user", content: user }],
  temperature: mode === "format" ? 0.65 : 0.85,
  max_tokens: 8192,
});

const outDir = join(__dir, "polish", mode === "format" ? "format" : "");
mkdirSync(outDir, { recursive: true });
const pad = (n) => String(n).padStart(2, "0");
const suffix = mode === "format" ? "format" : "doubao-pro";
const reqFile = join(__dir, `.doubao-${suffix}-ch${start}-${end}-req.json`);
writeFileSync(reqFile, payload, "utf8");

const t0 = Date.now();
const r = spawnSync(
  "curl",
  [
    "-sS",
    "--max-time",
    "600",
    "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    "-H",
    `Authorization: Bearer ${KEY}`,
    "-H",
    "Content-Type: application/json",
    "-d",
    `@${reqFile}`,
  ],
  { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
);

if (r.error) throw r.error;
if (r.status !== 0) throw new Error(`curl exit ${r.status}: ${r.stderr?.slice(0, 500)}`);

const json = JSON.parse(r.stdout);
if (json.error) throw new Error(JSON.stringify(json.error));

const content = json.choices?.[0]?.message?.content ?? "";
const outPath = join(outDir, `ch${pad(start)}-${pad(end)}-${suffix}.md`);
writeFileSync(outPath, content.trim() + "\n", "utf8");

console.log("OK", outPath, `${((Date.now() - t0) / 1000).toFixed(1)}s`, mode);

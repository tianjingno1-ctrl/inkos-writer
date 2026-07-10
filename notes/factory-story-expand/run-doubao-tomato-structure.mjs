#!/usr/bin/env node
/** 豆包审读：番茄女频10章节拍 + 字数 + 吃不吃 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const KEY =
  process.env.VOLCENGINE_ARK_API_KEY ??
  readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
const MODEL = process.env.DOUBAO_MODEL ?? "doubao-seed-2-1-pro-260628";

const md = readFileSync(join(__dir, "..", "temp-revised-story-final.md"), "utf8").replace(/\r\n/g, "\n");
const intro = md.match(/## 书籍简介[\s\S]*?(?=\n---\n\n## 备选)/)?.[0] ?? "";
const body = md.match(/## 正文\n([\s\S]*)/)?.[1] ?? "";
const han = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;
const parts = body.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);

const segmentSummary = parts
  .map((p, i) => `【现稿第${i + 1}段 · ${han(p)}字】${p.slice(0, 120).replace(/\n/g, " ")}…`)
  .join("\n");

const user = `你是番茄女频短篇「爆款结构顾问 + 责编」，熟悉番茄/新媒体女频短篇（重生打脸、职场逆袭、爽文）的上架节奏。

## 我的诉求（请严格按此输出，不要写正文）

1. **番茄吃不吃**：这篇题材+剧情在番茄女频短篇里有没有市场？读者会不会划走？一句话结论 + 3条理由。
2. **剧情对不对**：现稿情节链有没有断点、拖沓、重复、缺爽点？列出问题（如有）和改法（只改结构，不重写）。
3. **10章爆款节拍表**（目标：番茄女频短篇，全文 **8000~10000 汉字**）：
   - 每章一行表头：**章序 | 章节名（带钩子） | 核心事件 | 场景 | 主导情绪 | 建议字数 | 章末钩子**
   - 10章合计字数要落在 8000~10000，并说明每章字数为什么这样分配（开篇加重、炸场加重等）。
4. **现稿映射**：我目前是 ${parts.length} 个 \`---\` 段、正文 ${han(body)} 字。请说明每段该合并/拆成哪一章，缺多少字。
5. **前3章黄金法则**：单独说第1~3章各自必须完成的「人设+冲突+留存钩」。

## 定稿信息

**书名**：《全网看我：螺丝女工干翻天才前男友》
**标签**：女性生活、打脸逆袭、重生、爽文、职场

${intro}

## 现稿正文分段摘要（全文 ${han(body)} 字）

${segmentSummary}

## 输出格式

用 markdown 表格 + 简短点评，不要生成小说正文，不要空泛鼓励。`;

const payload = JSON.stringify({
  model: MODEL,
  messages: [
    {
      role: "system",
      content:
        "你是番茄女频短篇结构编辑。只输出审读、节拍表、字数规划，不生成小说正文。",
    },
    { role: "user", content: user },
  ],
  temperature: 0.65,
  max_tokens: 8192,
});

const reqFile = join(__dir, ".doubao-tomato-structure-req.json");
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
const outPath = join(__dir, "doubao-tomato-10chapters.md");
writeFileSync(
  outPath,
  `# 豆包审读 · 番茄10章节拍表\n\n> 模型：\`${MODEL}\`\n> 母版：temp-revised-story-final.md（正文 ${han(body)} 字）\n> 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n\n---\n\n${content}\n`,
  "utf8",
);
console.log("OK", outPath, content.length);

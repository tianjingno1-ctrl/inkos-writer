#!/usr/bin/env node
/** 全文 → 豆包番茄女频改写（非润色） */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const KEY =
  process.env.VOLCENGINE_ARK_API_KEY ??
  readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
const MODEL = process.env.DOUBAO_MODEL ?? "doubao-seed-2-0-pro-260215";
const API = process.env.VOLCENGINE_ARK_API_BASE ?? "https://ark.cn-beijing.volces.com/api/v3";

const srcPath = join(__dir, "full-polished.md");
const introPath = join(__dir, "..", "final", "sales-package.md");
const outMd = join(__dir, "fanqie-rewrite.md");
const outTxt = join(__dir, "白月光回国那晚-我终止了替身契约-番茄改写.txt");

const fullStory = readFileSync(srcPath, "utf8").replace(/^#.*\n\n?/m, "").trim();
const introBlock =
  readFileSync(introPath, "utf8").match(/## 简介\s*\n([\s\S]*?)(?=\n## )/)?.[1]?.trim() ?? "";

const systemPrompt = `你是番茄小说女频短篇责编兼写手，专精替身止损、追妻火葬场、豪门打脸类短篇。
任务是对母版做番茄平台向的大改（改写，非润色）：可调整顺序、删减重复、合并场景、加强钩子和爽点，核心人设与主线保留。
输出可直接上架的完整稿，只输出正文包，过程说明控制在50字内。`;

const userPrompt = `请将以下全文改写为番茄女频追妻火葬场短篇上架稿。

【书名】白月光回国那晚，我终止了替身契约

【简介（可微调措辞，核心信息保留）】
${introBlock}

【番茄改写要求】
- 保留主线：三年替身契约、白月光回国、女主止损离开、男主火葬场、旗袍工作室逆袭、网暴反击、雨夜跪门认爱、公开发布会、HE
- 保留细节杀：薄荷糖、速写本、便签饭盒、绿萝、樱花、撕契约
- 节奏：手机刷读友好，短句短段，一段最多三行，对话口语有张力
- 情绪链：委屈隐忍→清醒止损→男主追悔→公开护妻→甜收
- 篇幅：全文8000~10000汉字，10章，每章章末留钩子
- 开篇3秒抓人，前3章完成人设+冲突+留存

【输出格式（严格按此）】
书籍简介
（简介正文）

---
开篇钩子
（150~200字独立引子）

01.
（第1章正文，不写章节名）

02.
（第2章正文）

……

10.
（第10章正文）

（全文完）

【母版全文】

${fullStory}`;

const t0 = Date.now();
const res = await fetch(`${API}/chat/completions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.85,
    max_tokens: 32768,
  }),
});

const raw = await res.text();
if (!res.ok) throw new Error(`HTTP ${res.status} ${raw.slice(0, 800)}`);

const json = JSON.parse(raw);
if (json.error) throw new Error(JSON.stringify(json.error));

const content = (json.choices?.[0]?.message?.content ?? "").trim();
if (!content) throw new Error("empty response");

const header = `# 白月光回国那晚，我终止了替身契约 · 番茄改写\n\n> 模型：\`${MODEL}\`\n> 源：full-polished.md\n> 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n\n---\n\n`;

writeFileSync(outMd, header + content + "\n", "utf8");

// plain txt for upload (strip markdown header if model added)
const txtBody = content
  .replace(/^#+\s.*\n+/gm, "")
  .replace(/^>\s.*\n+/gm, "")
  .trim();
writeFileSync(outTxt, txtBody + "\n", "utf8");

const han = (txtBody.match(/[\u4e00-\u9fff]/g) || []).length;
console.log("OK", outMd);
console.log("OK", outTxt);
console.log("han:", han, "model:", MODEL);
if (json.usage) console.log("tokens:", json.usage);

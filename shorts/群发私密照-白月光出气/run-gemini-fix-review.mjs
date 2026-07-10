#!/usr/bin/env node
/** Gemini 验收修复：引号 / 收尾 / 过渡句 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

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
const MODEL = "gemini-2.5-pro";
const task = process.argv[2] ?? "quotes";

const raw = readFileSync(join(__dir, "final/full.md"), "utf8").replace(/\r\n/g, "\n");

function extractSections(text, from, to) {
  const re = /^###(\d+)\.\s*$/gm;
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null) hits.push({ num: parseInt(m[1], 10), index: m.index });
  const blocks = [];
  for (let i = 0; i < hits.length; i++) {
    const n = hits[i].num;
    if (n < from || n > to) continue;
    const start = hits[i].index;
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    blocks.push(text.slice(start, end).trim());
  }
  return blocks.join("\n\n");
}

const TASKS = {
  quotes: {
    file: "fix-quotes-12-15-gemini25.md",
    sections: [12, 15],
    system: `你是黑岩短篇格式编辑。只修格式，不改剧情、不改句意、不增删 ### 小节。

任务：
- 为所有人物对话、电话台词、当众宣布、警察执法用语补上中文引号「」
- 叙述段保持一句一段，段间空一行
- 保留 ###12. ###13. ###14. ###15. 标题
- 只输出修后正文，不要解释`,
    user: extractSections(raw, 12, 15),
  },
  ending: {
    file: "fix-ending-21-gemini25.md",
    sections: [21],
    system: `你是黑岩短篇结尾编辑。只修 ###21.，不改剧情事实。

必须做：
1. 删或改写「封神的注脚」这类口号句，改成具体结果（聘书/合伙人/案件）
2. 陆明「眼神里带着几分玩味」→ 公事公办、专业冷淡
3. 删掉末句「就像我的人生里，从未出现过那些脏东西」；保留「屏幕彻底干净了」作收束
4. 一句一段，保留 ###21.
只输出修后正文`,
    user: extractSections(raw, 21, 21),
  },
  transition: {
    file: "fix-transition-18-19-gemini25.md",
    sections: [18, 19],
    system: `你是逻辑编辑。只修 ###18. 与 ###19. 之间的保释金过渡，不改其他内容。

在 ###19. 开头「一个月后。」之后，加1-2句解释：顾家变卖资产、补齐部分税款和罚金后，顾宸才获准取保候审。与 ###18. 末句「凑不够保释金」衔接。
保留黑岩一句一段、### 编号。只输出 ###18. 到 ###19. 全文（含过渡）。`,
    user: extractSections(raw, 18, 19),
  },
};

const cfg = TASKS[task];
if (!cfg) {
  console.error("Unknown task:", task);
  process.exit(1);
}

const res = await fetch("https://api.apifast.tech/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: MODEL,
    messages: [
      { role: "system", content: cfg.system },
      { role: "user", content: cfg.user },
    ],
    temperature: 0.4,
    max_tokens: 8192,
  }),
});
const json = await res.json();
if (!res.ok || json.error) throw new Error(JSON.stringify(json.error ?? json));

const content = (json.choices?.[0]?.message?.content ?? "").trim();
const outDir = join(__dir, "polish");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, cfg.file);
writeFileSync(outPath, content + "\n", "utf8");
writeFileSync(
  join(outDir, cfg.file.replace(".md", ".meta.json")),
  JSON.stringify({ usage: json.usage, task }, null, 2),
);
console.log("OK", outPath, JSON.stringify(json.usage));

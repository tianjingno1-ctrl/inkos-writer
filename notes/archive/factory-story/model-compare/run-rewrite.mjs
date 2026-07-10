import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "../../..");
const outDir = __dir;

function loadKey() {
  if (process.env.VOLCENGINE_ARK_API_KEY) return process.env.VOLCENGINE_ARK_API_KEY.trim();
  try {
    return readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
  } catch {
    throw new Error("Missing VOLCENGINE_ARK_API_KEY or ~/.config/volcengine/ark-api-key");
  }
}

const API = process.env.VOLCENGINE_ARK_API_BASE ?? "https://ark.cn-beijing.volces.com/api/v3";
const KEY = loadKey();

const diagnosis = readFileSync(join(root, "archive/factory-story/versions/temp-revised-story-v2.md"), "utf8");
const draftMatch = diagnosis.match(/---修订正文---\n([\s\S]*)/);
const draftBody = draftMatch?.[1]?.trim() ?? diagnosis;

const systemPrompt = `你是番茄小说女频爽文资深编辑兼写手。只输出修订后的完整正文，不要解释、不要标题、不要分节标记、不要 JSON。
硬性要求：
- 女频：先虐后爽，开篇不满级横推；苏晚隐忍蓄力，亲手布局，非工具人
- 委屈要具体可共情（倒贴、论文被偷、穿小鞋），爽点是止损「你配不上我恨」而非纯技术竞赛
- 周皓会设局反咬；陆铮有怀疑→查证→愧疚偏爱过程；高潮靠苏晚预埋的坑爆发
- 短段、对话多、章内节奏快，每几百字有小钩子；禁止「不是…而是…」、少用破折号
- 全文8000-12000字，写完整故事到烟火气收尾`;

const userPrompt = `【上一版问题诊断与冲突骨架】
${diagnosis.split("---修订正文---")[0]}

【待改全文】
${draftBody}

请按番茄读者口味全文重写。保留人物名与核心事件链（校门口扔笔记→工厂穿小鞋→转账羞辱→反咬→老猫自证→签约演示社死→止损台词→糖水蛋收尾），但修正诊断中的三类问题。`;

const models = [
  { slug: "glm-5-2", id: "glm-5-2-260617", temperature: 0.82 },
  { slug: "doubao-seed-2-1-turbo", id: "doubao-seed-2-1-turbo-260628", temperature: 0.85 },
  { slug: "doubao-seed-evolving", id: "doubao-seed-evolving", temperature: 0.85 },
  { slug: "doubao-seed-character", id: "doubao-seed-character-260628", temperature: 0.88 },
];

async function callModel(model) {
  const started = Date.now();
  const res = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: model.temperature,
      max_tokens: 16384,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${model.id} HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = JSON.parse(text);
  const content = json.choices?.[0]?.message?.content ?? "";
  const usage = json.usage ?? {};
  return {
    content,
    elapsedMs: Date.now() - started,
    usage,
    finishReason: json.choices?.[0]?.finish_reason,
  };
}

mkdirSync(outDir, { recursive: true });
const meta = [];

for (const model of models) {
  const outPath = join(outDir, `${model.slug}.md`);
  process.stderr.write(`Calling ${model.id}...\n`);
  try {
    const result = await callModel(model);
    const header = `# 工厂文重写 · ${model.slug}\n\n> 模型：\`${model.id}\` · 温度：${model.temperature} · 耗时：${(result.elapsedMs / 1000).toFixed(1)}s · finish：${result.finishReason}\n> tokens：prompt ${result.usage.prompt_tokens ?? "?"} / completion ${result.usage.completion_tokens ?? "?"}\n\n---\n\n`;
    writeFileSync(outPath, header + result.content.trim() + "\n", "utf8");
    meta.push({ ...model, ok: true, ...result, outPath });
    process.stderr.write(`  OK → ${outPath} (${result.content.length} chars)\n`);
  } catch (e) {
    meta.push({ ...model, ok: false, error: String(e.message ?? e) });
    writeFileSync(join(outDir, `${model.slug}.error.txt`), String(e.stack ?? e), "utf8");
    process.stderr.write(`  FAIL: ${e.message}\n`);
  }
  await new Promise((r) => setTimeout(r, 2000));
}

writeFileSync(join(outDir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
process.stderr.write("Done.\n");

#!/usr/bin/env node
/** 番茄改写稿扩写到 ~10000 字 */
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

const srcPath = join(__dir, "白月光回国那晚-我终止了替身契约-番茄改写.txt");
const refPath = join(__dir, "full-polished.md");
const outMd = join(__dir, "fanqie-rewrite-10k.md");
const outTxt = join(__dir, "白月光回国那晚-我终止了替身契约-番茄改写.txt");

const current = readFileSync(srcPath, "utf8").replace(/\r\n/g, "\n").trim();
const ref = readFileSync(refPath, "utf8").replace(/^#.*\n\n?/m, "").trim();
const han = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;

const systemPrompt = `你是番茄小说女频短篇责编兼写手，专精替身止损、追妻火葬场。
任务：在现有番茄上架稿基础上扩写至约10000汉字，剧情主线与章节结构保持不变，扩写靠对话、细节、情绪、修罗场节拍。
输出完整上架稿，附一行字数统计即可。`;

const userPrompt = `请将以下番茄短篇从约${han(current)}字扩写到 **9500~10500汉字**。

【扩写原则】
- 保持：书籍简介、开篇钩子、01.~10. 格式、（全文完）结尾
- 每章扩到约900~1100字，章末保留或加强钩子
- 文风：番茄女频追妻火葬场，短句短段，一段最多三行，对话口语有张力
- 可补充的细节杀：薄荷糖空盒、速写本、冰箱便签、绿萝、雨夜跪门、免提电话、发布会、樱花标本、撕契约
- 可参考母版补充桥段与情绪，主线情节节点不变
- 简介和开篇钩子可略扩，合计不超过400字

【当前番茄稿】

${current}

【母版参考（仅供补桥段，以当前稿结构为准）】

${ref.slice(0, 12000)}
……（母版余下部分已省略，需要时按人设逻辑补全）`;

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
    temperature: 0.78,
    max_tokens: 32768,
  }),
});

const raw = await res.text();
if (!res.ok) throw new Error(`HTTP ${res.status} ${raw.slice(0, 800)}`);

const json = JSON.parse(raw);
if (json.error) throw new Error(JSON.stringify(json.error));

let content = (json.choices?.[0]?.message?.content ?? "").trim();
if (!content) throw new Error("empty response");

// strip trailing meta lines model may add
content = content.replace(/\n[（(]改稿[\s\S]*$/, "").replace(/\n[（(]全文完[）)]\s*$/, "\n（全文完）").trim();
if (!content.endsWith("（全文完）")) content += "\n\n（全文完）";

const header = `# 白月光回国那晚，我终止了替身契约 · 番茄改写 10k\n\n> 模型：\`${MODEL}\`\n> 源：番茄改写稿扩写\n> 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n> 字数：${han(content)} 汉字\n\n---\n\n`;

writeFileSync(outMd, header + content + "\n", "utf8");

const txtBody = content
  .replace(/^#+\s.*\n+/gm, "")
  .replace(/^>\s.*\n+/gm, "")
  .trim();
writeFileSync(outTxt, txtBody + "\n", "utf8");

console.log("OK", outMd);
console.log("OK", outTxt);
console.log("han:", han(txtBody), "model:", MODEL);
if (json.usage) console.log("tokens:", json.usage);

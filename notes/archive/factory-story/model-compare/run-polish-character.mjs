import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const KEY =
  process.env.VOLCENGINE_ARK_API_KEY ??
  readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
const MODEL = "doubao-seed-character-260628";

const story = readFileSync(join(__dir, "../versions/temp-revised-story-v4.md"), "utf8");
const body = story.replace(/^#.*?\n\n>[\s\S]*?\n\n---\n\n/, "");

const user = `番茄女频短篇，润色下面正文：对话改活、有火药味，情绪拉满，段落要短，节奏要快，剧情不变。只输出正文。

${body}`;

const payload = JSON.stringify({
  model: MODEL,
  messages: [
    {
      role: "system",
      content: "你是番茄女频短篇写手，擅长重生打脸、职场爽文。输出可直接发布的正文。",
    },
    { role: "user", content: user },
  ],
  temperature: 0.92,
  max_tokens: 16384,
});

const reqFile = join(__dir, ".polish-character-req.json");
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
  { encoding: "utf8", maxBuffer: 30 * 1024 * 1024 },
);

if (r.error) throw r.error;
if (r.status !== 0) throw new Error(`curl exit ${r.status}: ${r.stderr?.slice(0, 500)}`);

const json = JSON.parse(r.stdout);
if (json.error) throw new Error(JSON.stringify(json.error));

const content = json.choices?.[0]?.message?.content ?? "";
const modelOut = join(__dir, "doubao-seed-character-v4-polish.md");
const v5Out = join(__dir, "../versions/temp-revised-story-v5.md");

const header = `# 工厂打脸短篇 · v5（Character 润色 · 基于 v4）

> 模型：\`${MODEL}\`  
> 标签：女性生活、打脸逆袭、重生、爽文、职场  

---

`;

writeFileSync(modelOut, `${header}${content}\n\n---\n\n耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n`, "utf8");
writeFileSync(v5Out, `${header}${content}\n`, "utf8");

console.log(
  "OK",
  v5Out,
  content.length,
  `${((Date.now() - t0) / 1000).toFixed(1)}s`,
  JSON.stringify(json.usage),
);

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const KEY =
  process.env.VOLCENGINE_ARK_API_KEY ??
  readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
const MODEL = "doubao-seed-2-1-pro-260628";

const story = readFileSync(join(__dir, "../versions/temp-revised-story-v3.md"), "utf8");
const body = story.replace(/^#.*?\n\n>[\s\S]*?\n\n---\n\n/, "");

const user = `我是番茄女频作者，这篇现在读者不爱看、没有想读下去的欲望。帮我审阅一下为什么不吸引人，怎么改。

${body}`;

const payload = JSON.stringify({
  model: MODEL,
  messages: [{ role: "user", content: user }],
  temperature: 0.7,
  max_tokens: 8192,
});

const reqFile = join(__dir, ".review-pro-req.json");
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
const outPath = join(__dir, "review-pro-v3.md");
writeFileSync(
  outPath,
  `# Doubao-Seed-2.1-pro 审阅 · v3\n\n> 模型：\`${MODEL}\`\n> prompt：一句话 + 正文\n\n---\n\n${content}\n\n---\n\n耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n\`\`\`json\n${JSON.stringify({ usage: json.usage, finish_reason: json.choices?.[0]?.finish_reason }, null, 2)}\n\`\`\`\n`,
  "utf8",
);
console.log("OK", outPath, content.length, `${((Date.now() - t0) / 1000).toFixed(1)}s`);

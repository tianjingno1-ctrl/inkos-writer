#!/usr/bin/env node
/** 仅合并 expand-chapters → 上架 txt，不调 API */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, "fanqie-rewrite.md");
const OUT_DIR = join(__dir, "expand-chapters");
const OUT_TXT = join(__dir, "白月光回国那晚-我终止了替身契约-番茄改写.txt");
const OUT_MD = join(__dir, "fanqie-rewrite-10k.md");

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
  return { intro, hook };
}

const raw = readFileSync(SRC, "utf8");
const { intro, hook } = parseFanqieMd(raw);
const parts = [intro, "", "---", "", hook, "", "---", ""];

for (let i = 1; i <= 10; i++) {
  const pad = String(i).padStart(2, "0");
  const body = readFileSync(join(OUT_DIR, `ch${pad}.md`), "utf8").trim();
  parts.push(`${pad}.`, body, "", "");
  console.log(`ch${pad}: ${han(body)}`);
}
parts.push("（全文完）");

const txtBody = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
writeFileSync(OUT_TXT, txtBody, "utf8");
writeFileSync(
  OUT_MD,
  `# 白月光回国那晚，我终止了替身契约 · 番茄改写 10k\n\n> 按章扩写合并\n> 字数：${han(txtBody)} 汉字\n\n---\n\n${txtBody}`,
  "utf8",
);
console.log("TOTAL han:", han(txtBody));
console.log("Saved", OUT_TXT);

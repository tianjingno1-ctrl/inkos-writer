#!/usr/bin/env node
/** 合并 format 批次 → 上架包（开篇钩子 + 01. 分段，无章标题） */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const notes = join(__dir, "..");
const formatDir = join(__dir, "polish", "format");

const OPENING_HOOK = `【小偷偷来的荣光，我能给你，就能亲手把你拽下十八层地狱，连本带利，碎渣都不剩。】

重生睁眼的第一秒，我看着领奖台上穿我攒三个月钱买的鹅绒服、偷我专利拿国奖的渣男，直接笑出了声。`;

const SOURCES = [
  { file: "ch01-02-format.md", nums: [1, 2] },
  { file: "ch03-04-format.md", nums: [3, 4] },
  { file: "ch05-06-format.md", nums: [5, 6] },
  { file: "ch07-08-format.md", nums: [7, 8] },
  { file: "ch09-10-format.md", nums: [9, 10] },
];

const TITLE_RE = /^#{0,3}\s*第(\d+)章[^\n]*\n/m;

function splitChapters(text) {
  const parts = text.split(/\n(?=#{0,3}\s*第\d+章)/);
  const map = new Map();
  for (const part of parts) {
    const m = part.match(/^#{0,3}\s*第(\d+)章[^\n]*\n([\s\S]*)/);
    if (!m) continue;
    map.set(parseInt(m[1], 10), m[2].replace(/^---\n?/, "").replace(/\n---\s*$/, "").trim());
  }
  return map;
}

function stripAuthorNote(s) {
  return s
    .replace(/\n*【作者有话说：[\s\S]*$/m, "")
    .replace(/\n*（全文完）\s*$/m, "")
    .trim();
}

const all = new Map();
for (const { file, nums } of SOURCES) {
  const raw = readFileSync(join(formatDir, file), "utf8").replace(/\r\n/g, "\n");
  const map = splitChapters(raw);
  for (const n of nums) {
    if (!map.has(n)) throw new Error(`missing ch${n} in ${file}`);
    all.set(n, map.get(n));
  }
}

// ch1: drop duplicate opening hook + wedge (already in OPENING_HOOK)
let ch1 = all.get(1);
ch1 = ch1
  .replace(/^【小偷偷来的荣光[\s\S]*?\n\n/m, "")
  .replace(/^重生睁眼的第一秒[\s\S]*?\n\n/m, "")
  .trim();

const bodyParts = [];
for (let n = 1; n <= 10; n++) {
  const content = stripAuthorNote(n === 1 ? ch1 : all.get(n));
  bodyParts.push(`${String(n).padStart(2, "0")}.\n\n${content}`);
}

const body = `${OPENING_HOOK}\n\n${bodyParts.join("\n\n")}\n\n（全文完）\n`;

const meta = readFileSync(join(notes, "temp-revised-story-final.md"), "utf8");
const head = meta.match(/^[\s\S]*?(?=## 正文)/)?.[0] ?? "";
const final = `${head}## 正文\n\n${body}`;
writeFileSync(join(notes, "temp-revised-story-final.md"), final, "utf8");

const txt = `全网看我：螺丝女工干翻天才前男友\n\n${body}`;
writeFileSync(join(notes, "全网看我-螺丝女工干翻天才前男友.txt"), txt, "utf8");

const han = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;
console.log("OK temp-revised-story-final.md");
console.log("OK 全网看我-螺丝女工干翻天才前男友.txt");
console.log("正文", han(body), "字");

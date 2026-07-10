#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const fullPath = join(__dir, "final/full.md");
let text = readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");

function parseSections(content) {
  const re = /^###(\d+)\.\s*$/gm;
  const hits = [];
  let m;
  while ((m = re.exec(content)) !== null) hits.push({ num: parseInt(m[1], 10), index: m.index });
  const map = new Map();
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index;
    const end = i + 1 < hits.length ? hits[i + 1].index : content.length;
    map.set(hits[i].num, content.slice(start, end).trim());
  }
  return map;
}

function replaceRange(text, from, to, patchText) {
  const patch = parseSections(patchText);
  const main = parseSections(text);
  for (let n = from; n <= to; n++) {
    if (patch.has(n)) main.set(n, patch.get(n));
  }
  const preamble = text.split(/^###1\.\s*$/m)[0].trim();
  const nums = [...main.keys()].sort((a, b) => a - b);
  const body = nums.map((n) => main.get(n)).join("\n\n");
  return `${preamble}\n\n${body}\n`;
}

const polish = join(__dir, "polish");
const quotes = readFileSync(join(polish, "fix-quotes-12-15-gemini25.md"), "utf8");
const transition = readFileSync(join(polish, "fix-transition-18-19-gemini25.md"), "utf8");
const ending = readFileSync(join(polish, "fix-ending-21-gemini25.md"), "utf8");

text = replaceRange(text, 12, 15, quotes);
text = replaceRange(text, 18, 19, transition);
text = replaceRange(text, 21, 21, ending);
text = text.replace(/\n---\n\n(?=###1\.)/, "\n\n");

writeFileSync(fullPath, text, "utf8");
writeFileSync(join(__dir, "final/full-gemini25.md"), text, "utf8");
console.log("Applied fixes -> final/full.md");

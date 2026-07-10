#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const polishDir = join(__dir, "polish");
const files = readdirSync(polishDir)
  .filter((f) => /^sec\d+-\d+-gemini25\.md$/.test(f))
  .sort();

const preambleEnd = readFileSync(join(__dir, "final/full.md"), "utf8").split(/^###1\.\s*$/m)[0].trim();

const allSections = new Map();
for (const f of files) {
  const text = readFileSync(join(polishDir, f), "utf8").replace(/\r\n/g, "\n");
  const re = /^###(\d+)\.\s*$/gm;
  let m;
  const hits = [];
  while ((m = re.exec(text)) !== null) hits.push({ num: parseInt(m[1], 10), index: m.index });
  for (let i = 0; i < hits.length; i++) {
    const startIdx = hits[i].index;
    const endIdx = i + 1 < hits.length ? hits[i + 1].index : text.length;
    allSections.set(hits[i].num, text.slice(startIdx, endIdx).trim());
  }
}

const nums = [...allSections.keys()].sort((a, b) => a - b);
const body = nums.map((n) => allSections.get(n)).join("\n\n");
const out = `${preambleEnd}\n\n${body}\n`;
writeFileSync(join(__dir, "final/full-gemini25.md"), out, "utf8");
writeFileSync(join(__dir, "final/full.md"), out, "utf8");
console.log("Merged", nums.length, "sections -> final/full.md + full-gemini25.md");

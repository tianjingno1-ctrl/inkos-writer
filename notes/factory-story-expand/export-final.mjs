#!/usr/bin/env node
/** 统一扩写段的英文直引号为「」并导出上架 txt */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseChapters,
  serializeChapters,
  saveLatest,
  loadLatest,
  countHan,
} from "./lib/chapters.mjs";

function normalizeQuotes(text) {
  return text
    .split("\n")
    .map((line) => {
      if (!line.includes('"')) return line;
      let out = "";
      let open = true;
      for (const ch of line) {
        if (ch === '"') {
          out += open ? "「" : "」";
          open = !open;
        } else {
          out += ch;
        }
      }
      return out;
    })
    .join("\n");
}

const __dir = dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(readFileSync(join(__dir, "tasks.json"), "utf8"));
const workDir = join(__dir, "work");
const order = meta.chapterOrder;

const chapters = parseChapters(loadLatest(workDir));
const merged = serializeChapters(chapters, order);
const normalized = normalizeQuotes(merged);
saveLatest(workDir, normalized);

const body = order
  .map((t) => `${t}\n\n${parseChapters(normalized)[t]}`)
  .join("\n\n");
const outExpand = join(__dir, "全网看我-螺丝女工干翻天才前男友-扩写中.txt");
const outNotes = join(__dir, "..", "全网看我-螺丝女工干翻天才前男友.txt");
const full = `${meta.title}\n\n${body}\n`;
writeFileSync(outExpand, full, "utf8");
writeFileSync(outNotes, full, "utf8");

console.log("quotes normalized", countHan(normalized), "han");
console.log("→", outNotes);

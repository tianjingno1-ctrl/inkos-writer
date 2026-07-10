#!/usr/bin/env node
/** 清理 latest.md 中累积的分隔符，并重导 txt */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseChapters,
  serializeChapters,
  saveLatest,
  loadLatest,
  countHan,
  exportTxt,
} from "./lib/chapters.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(readFileSync(join(__dir, "tasks.json"), "utf8"));
const order = meta.chapterOrder;
const chapters = parseChapters(loadLatest(join(__dir, "work")));
saveLatest(join(__dir, "work"), serializeChapters(chapters, order));
const total = countHan(loadLatest(join(__dir, "work")));
const txt = exportTxt(join(__dir, "work"), meta.title, order);
console.log("cleaned", total, "han", txt);

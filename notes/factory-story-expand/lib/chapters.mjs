import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CHAPTER_RE = /^## (第\d+章 .+)$/m;

export function parseChapters(md) {
  const text = md.replace(/\r\n/g, "\n");
  const parts = text.split(/\n(?=## 第\d+章 )/);
  const chapters = {};
  for (const part of parts) {
    const m = part.match(/^## (第\d+章 .+)\n([\s\S]*)$/);
    if (!m) continue;
    chapters[m[1]] = m[2]
      .split("\n")
      .filter((line) => line.trim() !== "---")
      .join("\n")
      .trim();
  }
  return chapters;
}

export function serializeChapters(chapters, order) {
  return order
    .map((title) => `## ${title}\n\n${chapters[title].trim()}\n`)
    .join("\n---\n\n");
}

export function loadLatest(workDir) {
  return readFileSync(join(workDir, "latest.md"), "utf8").replace(/\r\n/g, "\n");
}

export function saveLatest(workDir, content) {
  writeFileSync(join(workDir, "latest.md"), content, "utf8");
}

export function countHan(text) {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

export function exportTxt(workDir, title, order) {
  const chapters = parseChapters(loadLatest(workDir));
  const body = order
    .map((t) => `${t}\n\n${chapters[t]}`)
    .join("\n\n");
  const path = join(workDir, "..", "全网看我-螺丝女工干翻天才前男友-扩写中.txt");
  writeFileSync(path, `${title}\n\n${body}\n`, "utf8");
  return path;
}

export function getChapterOrder(workDir) {
  const meta = JSON.parse(readFileSync(join(workDir, "..", "tasks.json"), "utf8"));
  return meta.chapterOrder;
}

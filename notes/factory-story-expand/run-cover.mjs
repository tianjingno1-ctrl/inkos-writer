#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { generateShortFictionCover } from "../../packages/core/dist/pipeline/short-fiction-runner.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..", "..");
const outDir = "notes/factory-story-expand";
const coverPrompt = readFileSync(join(__dir, "cover-prompt.md"), "utf8").trim();

const final = readFileSync(join(__dir, "..", "temp-revised-story-final.md"), "utf8");
const intro =
  final.match(/## 书籍简介（上架定稿）\n\n([\s\S]*?)\n\n---/)?.[1]?.trim() ?? "";
const title = "全网看我：螺丝女工干翻天才前男友";

const result = await generateShortFictionCover({
  projectRoot: root,
  title,
  intro,
  sellingPoints: ["重生打脸", "螺丝女工逆袭", "错字溯源", "23号工位", "直播炸机铁证"],
  coverPrompt,
  outputDir: outDir,
  promptMode: "short",
  coverSize: process.env.INKOS_COVER_SIZE ?? "1024x1360",
});

writeFileSync(join(__dir, "cover-prompt.md"), coverPrompt + "\n", "utf8");

const absCover = join(root, ...result.coverImagePath.split("/"));
const fanqie = join(__dir, "cover-fanqie-600x800.png");

// 模型常出横图/错比例 → 强制裁成番茄 600×800
copyFileSync(absCover, fanqie);
const fix = spawnSync(process.execPath, [join(__dir, "fix-cover-fanqie.mjs"), fanqie], {
  encoding: "utf8",
});
if (fix.status !== 0) throw new Error(fix.stderr || fix.stdout);

copyFileSync(fanqie, join(__dir, "cover.png"));
copyFileSync(fanqie, join(__dir, "..", "cover-fanqie-600x800.png"));

console.log("OK 600x800", fanqie);

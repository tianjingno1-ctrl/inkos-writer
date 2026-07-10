#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { generateShortFictionCover } from "../../../../packages/core/dist/pipeline/short-fiction-runner.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..", "..", "..", "..");
const outDir = "shorts/刑辩律师我不装了/drafts/v001";
const coverPrompt = readFileSync(join(__dir, "cover-prompt.md"), "utf8").trim();

const title = "拿我女儿逼我顶罪？刑辩律师我不装了";
const intro =
  "丈夫逼我签顶罪合同、拿三岁女儿要挟；八年退居幕后的刑辩律师程敏不装了，取证庭审反手送他入狱。";

const result = await generateShortFictionCover({
  projectRoot: root,
  title,
  intro,
  sellingPoints: ["刑辩律师反杀", "顶罪合同", "拿女儿要挟", "法庭打脸", "婚姻复仇"],
  coverPrompt,
  outputDir: outDir,
  promptMode: "short",
  coverSize: process.env.INKOS_COVER_SIZE ?? "1024x1360",
});

const absCover = join(root, ...result.coverImagePath.split("/"));
const fanqie = join(__dir, "cover-fanqie-600x800.png");

copyFileSync(absCover, fanqie);
const fixScript = join(root, "notes/factory-story-expand/fix-cover-fanqie.mjs");
const fix = spawnSync(process.execPath, [fixScript, fanqie], { encoding: "utf8" });
if (fix.status !== 0) throw new Error(fix.stderr || fix.stdout);

copyFileSync(fanqie, join(__dir, "cover.png"));
console.log("OK 600x800", fanqie);
console.log("source", absCover);

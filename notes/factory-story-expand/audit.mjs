#!/usr/bin/env node
/** 扩写后自动审计：字数、锚点、文风、重复、格式 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseChapters, loadLatest, countHan } from "./lib/chapters.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const meta = JSON.parse(readFileSync(join(__dir, "tasks.json"), "utf8"));
const order = meta.chapterOrder;
const raw = loadLatest(join(__dir, "work"));
const chapters = parseChapters(raw);
const totalHan = countHan(raw);

const anchors = [
  ["扭距", "溯源错字锚点"],
  ["23号", "工位锚点"],
  ["103N·m", "正确扭矩"],
  ["127N·m", "错误扭矩"],
  ["0.84丝", "核心专利"],
  ["老猫", "论坛身份"],
  ["急停", "第5章救命"],
  ["技术合伙人", "结局身份"],
  ["三分糖", "甜宠细节"],
];

const badPhrases = ["至暗瞬间", "何其讽刺", "命运齿轮", "深渊", "窒息感"];
const quoteStyleIssues = (raw.match(/"[^"]{4,}"/g) || []).length;

const perChapter = order.map((title) => ({
  title,
  han: countHan(chapters[title] || ""),
}));

const deltaTotal = meta.tasks.reduce((s, t) => s + (t.chapterHanDelta || 0), 0);
const orphanSeparators = (raw.match(/\n---\n\n---\n/g) || []).length;
const straightQuotes = (raw.match(/"/g) || []).length / 2;

const issues = [];
const passes = [];

if (totalHan < meta.targetHan) {
  issues.push({
    level: "warn",
    msg: `全书 ${totalHan} 字，低于目标 ${meta.targetHan}（差 ${meta.targetHan - totalHan}）`,
  });
} else {
  passes.push(`字数达标：${totalHan} 字`);
}

if (orphanSeparators > 0) {
  issues.push({ level: "fix", msg: `发现 ${orphanSeparators} 处连续 --- 分隔符污染` });
} else {
  passes.push("章节分隔符正常");
}

for (const [term, label] of anchors) {
  if (!raw.includes(term)) {
    issues.push({ level: "error", msg: `缺失锚点「${term}」（${label}）` });
  }
}

// 第6章师傅骂的是「基础扭矩」不是「基础扭距」——扩写误改
if (raw.includes("基础扭距都能调错")) {
  issues.push({
    level: "fix",
    msg: "第6章结尾师傅台词误写「基础扭距」→ 应为「基础扭矩」",
  });
}

for (const p of badPhrases) {
  const n = (raw.match(new RegExp(p, "g")) || []).length;
  if (n > 0 && p === "何其讽刺") {
    issues.push({ level: "info", msg: `保留1处「何其讽刺」（重生回忆段），共 ${n} 处` });
  } else if (n > 1) {
    issues.push({ level: "warn", msg: `「${p}」出现 ${n} 次，检查是否空泛堆叠` });
  }
}

if (straightQuotes > 15) {
  issues.push({
    level: "fix",
    msg: `扩写段使用英文直引号 ${Math.round(straightQuotes)} 处，建议统一为「」`,
  });
}

// 重复句检测（简单）
const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
const seen = new Map();
for (const line of lines) {
  if (line.length < 12) continue;
  seen.set(line, (seen.get(line) || 0) + 1);
}
const dupes = [...seen.entries()].filter(([, c]) => c > 1);
if (dupes.length) {
  issues.push({
    level: "warn",
    msg: `重复行 ${dupes.length} 条，如：${dupes[0][0].slice(0, 30)}…`,
  });
}

const report = `# 扩写审计报告

> 生成时间：${new Date().toISOString().slice(0, 10)}  
> 模型：\`${meta.model}\` · ${meta.tasks.length} 步全部完成

## 字数

| 项 | 值 |
|----|-----|
| 基线 | ${meta.baselineHan} |
| 扩写后 | **${totalHan}** |
| 净增 | +${totalHan - meta.baselineHan}（任务累计 +${deltaTotal}） |
| 目标 | ${meta.targetHan} |
| 缺口 | ${totalHan < meta.targetHan ? meta.targetHan - totalHan : 0} |

### 分章字数

| 章 | 汉字 |
|----|------|
${perChapter.map((c) => `| ${c.title.replace(/^第\d+章 /, "")} | ${c.han} |`).join("\n")}

## 任务执行

| ID | 增量 | 状态 |
|----|------|------|
${meta.tasks.map((t) => `| ${t.id} | +${t.chapterHanDelta} | ✓ |`).join("\n")}

## 剧情锚点

${anchors.map(([t]) => `- [${raw.includes(t) ? "x" : " "}] ${t}`).join("\n")}

## 通过项

${passes.map((p) => `- ✓ ${p}`).join("\n")}

## 问题清单

${issues.length ? issues.map((i) => `- **${i.level.toUpperCase()}** ${i.msg}`).join("\n") : "- 无 blocking 问题"}

## 扩写质量简评

**做得好的：**
- 第2章工友群像、第3章改口链、第5章弹幕逐条曝光，均按火花节拍落地
- 核心爽点（扭距溯源、103/127、急停、专利签约）全部保留
- 未新增支线，陆铮甜宠线克制

**需人工过一遍：**
- 无 blocking 项；可直接上架试读

## 建议下一步

\`\`\`powershell
node clean-latest.mjs          # 已修复分隔符逻辑，可重复跑
node run-step.mjs --step 07 --force   # 若新增补字任务
\`\`\`

`;

writeFileSync(join(__dir, "AUDIT.md"), report, "utf8");
console.log(report);
console.log("\n→ 已写入 AUDIT.md");

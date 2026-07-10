#!/usr/bin/env node
/**
 * 按任务 ID 逐步调用豆包 2.0 扩写单章。
 *
 * 用法：
 *   node run-step.mjs --step 01
 *   node run-step.mjs --next
 *   node run-step.mjs --list
 *   node run-step.mjs --status
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  parseChapters,
  serializeChapters,
  loadLatest,
  saveLatest,
  countHan,
  exportTxt,
  getChapterOrder,
} from "./lib/chapters.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const TASKS_PATH = join(__dir, "tasks.json");
const WORK_DIR = join(__dir, "work");
const STEPS_DIR = join(__dir, "steps");

const KEY =
  process.env.VOLCENGINE_ARK_API_KEY ??
  readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();

function loadTasks() {
  return JSON.parse(readFileSync(TASKS_PATH, "utf8"));
}

function saveTasks(meta) {
  writeFileSync(TASKS_PATH, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
}

function buildPrompt(task, chapterText) {
  return `【改稿合同】
你是番茄女频短篇「豆包老师」，帮作者做**单点扩写**，不是全文重写。

硬性要求：
1. **只改下面这一个修改点**，其余剧情、金句、人名、参数（103N·m / 127N·m / 0.84丝 / 扭距错字）一律保留。
2. **不新增情节线**，不删已有爽点，不加空泛文艺渲染（禁止叠「何其讽刺」「至暗瞬间」这类拖节奏句）。
3. 扩写靠**桥段节拍**：对话、围观、弹幕、短镜头；段落要短，节奏要快。
4. 书名《全网看我：螺丝女工干翻天才前男友》；简介里的「错字=溯源烙印、23号工位」等设定勿动。
5. **只输出本章正文**（不要章节标题、不要说明、不要 markdown 标题）。

---

【本步唯一修改点 · 任务 ${task.id}】
章节：${task.chapterTitle}
火花参考：${task.huohua}
要求：${task.point}
预期增量：${task.expectHan} 汉字

---

【当前章节正文】

${chapterText}`;
}

function callDoubao(model, system, user) {
  mkdirSync(STEPS_DIR, { recursive: true });
  const reqFile = join(STEPS_DIR, ".last-req.json");
  const payload = JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.88,
    max_tokens: 8192,
  });
  writeFileSync(reqFile, payload, "utf8");

  const t0 = Date.now();
  const r = spawnSync(
    "curl",
    [
      "-sS",
      "--max-time",
      "300",
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      "-H",
      `Authorization: Bearer ${KEY}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      `@${reqFile}`,
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );

  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`curl exit ${r.status}: ${r.stderr?.slice(0, 500)}`);

  const json = JSON.parse(r.stdout);
  if (json.error) throw new Error(JSON.stringify(json.error));

  const content = (json.choices?.[0]?.message?.content ?? "").trim();
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  return { content, elapsed, usage: json.usage };
}

function stripChapterTitle(text) {
  return text.replace(/^##?\s*第\d+章[^\n]*\n+/m, "").trim();
}

function runStep(stepId) {
  const meta = loadTasks();
  const task = meta.tasks.find((t) => t.id === stepId);
  if (!task) throw new Error(`未知任务 ID: ${stepId}`);

  if (task.status === "done") {
    console.warn(`任务 ${stepId} 已完成，跳过。用 --force 可重做。`);
    return;
  }

  const order = meta.chapterOrder;
  const chapters = parseChapters(loadLatest(WORK_DIR));
  const chapterText = chapters[task.chapterTitle];
  if (!chapterText) throw new Error(`找不到章节: ${task.chapterTitle}`);

  const beforeHan = countHan(chapterText);
  const model = process.env.DOUBAO_MODEL ?? meta.model;

  console.log(`\n▶ 任务 ${task.id} · ${task.chapterTitle}`);
  console.log(`  修改点: ${task.point}`);
  console.log(`  模型: ${model}`);
  console.log(`  章内基线: ${beforeHan} 字\n`);

  const { content, elapsed, usage } = callDoubao(
    model,
    "你是番茄女频短篇扩写助手。严格按改稿合同，只完成指定修改点，输出本章正文。",
    buildPrompt(task, chapterText),
  );

  const cleaned = stripChapterTitle(content);
  const afterHan = countHan(cleaned);
  const delta = afterHan - beforeHan;

  mkdirSync(STEPS_DIR, { recursive: true });
  const stepPath = join(STEPS_DIR, `${task.id}.md`);
  writeFileSync(
    stepPath,
    `# 任务 ${task.id}\n\n> ${task.point}\n\n---\n\n${cleaned}\n\n---\n\n章内 ${beforeHan} → ${afterHan} (+${delta}) · ${elapsed}s\n`,
    "utf8",
  );

  chapters[task.chapterTitle] = cleaned;
  saveLatest(WORK_DIR, serializeChapters(chapters, order));

  task.status = "done";
  task.doneAt = new Date().toISOString();
  task.chapterHanBefore = beforeHan;
  task.chapterHanAfter = afterHan;
  task.chapterHanDelta = delta;
  saveTasks(meta);

  const totalHan = countHan(loadLatest(WORK_DIR));
  const txtPath = exportTxt(WORK_DIR, meta.title, order);

  console.log(`✓ 已写入 steps/${task.id}.md`);
  console.log(`  章内 +${delta} 字 (${beforeHan} → ${afterHan})`);
  console.log(`  全书 ${totalHan} 字 · 目标 ${meta.targetHan}`);
  console.log(`  耗时 ${elapsed}s · usage ${JSON.stringify(usage)}`);
  console.log(`  导出 ${txtPath}\n`);
}

function printStatus() {
  const meta = loadTasks();
  const totalHan = countHan(loadLatest(WORK_DIR));
  const done = meta.tasks.filter((t) => t.status === "done").length;
  console.log(`\n《${meta.title}》扩写进度 ${done}/${meta.tasks.length}`);
  console.log(`全书 ${totalHan} 字 · 基线 ${meta.baselineHan} · 目标 ${meta.targetHan}\n`);
  for (const t of meta.tasks) {
    const mark = t.status === "done" ? "✓" : "○";
    const delta = t.chapterHanDelta != null ? ` (+${t.chapterHanDelta})` : "";
    console.log(`${mark} ${t.id.padEnd(4)} 第${t.chapter}章  ${t.point.slice(0, 36)}…${delta}`);
  }
  console.log("");
}

function printList() {
  const meta = loadTasks();
  meta.tasks.forEach((t) => {
    console.log(`${t.id}\t[${t.status}]\t${t.chapterTitle}\n\t${t.point}\n`);
  });
}

const args = process.argv.slice(2);
const force = args.includes("--force");

if (args.includes("--status")) {
  printStatus();
  process.exit(0);
}

if (args.includes("--list")) {
  printList();
  process.exit(0);
}

let stepId = null;
if (args.includes("--next")) {
  const meta = loadTasks();
  const next = meta.tasks.find((t) => t.status !== "done");
  if (!next) {
    console.log("全部任务已完成。");
    printStatus();
    process.exit(0);
  }
  stepId = next.id;
} else {
  const i = args.indexOf("--step");
  if (i === -1 || !args[i + 1]) {
    console.log(`用法:
  node run-step.mjs --step 01
  node run-step.mjs --next
  node run-step.mjs --status
  node run-step.mjs --list`);
    process.exit(1);
  }
  stepId = args[i + 1];
}

if (force) {
  const meta = loadTasks();
  const task = meta.tasks.find((t) => t.id === stepId);
  if (task) {
    task.status = "pending";
    saveTasks(meta);
  }
}

runStep(stepId);

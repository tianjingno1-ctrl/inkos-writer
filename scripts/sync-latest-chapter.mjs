#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.argv[2] ?? process.cwd();
const bookIdArg = process.argv[3];
const brief =
  process.argv[4] ??
  "仅文风润色，剧情人物事件未变，请按正文更新摘要与状态，不要臆造新剧情。";

const booksDir = join(root, "books");
if (!existsSync(booksDir)) {
  console.error(`[错误] 未找到 books 目录: ${booksDir}`);
  process.exit(1);
}

function listBooks() {
  return readdirSync(booksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

let bookId = bookIdArg;
if (!bookId) {
  const books = listBooks();
  if (books.length === 0) {
    console.error("[错误] 还没有任何书籍，请先在 InkOS 里建书。");
    process.exit(1);
  }
  if (books.length > 1) {
    console.error("[错误] 检测到多本书，请指定书名：");
    console.error(`  sync-latest-chapter.bat ${books[0]}`);
    for (const id of books) {
      console.error(`  - ${id}`);
    }
    process.exit(1);
  }
  bookId = books[0];
}

const bookDir = join(booksDir, bookId);
const chaptersDir = join(bookDir, "chapters");
if (!existsSync(chaptersDir)) {
  console.error(`[错误] 书籍 "${bookId}" 下没有 chapters 目录。`);
  process.exit(1);
}

function resolveLatestChapterNumber() {
  const indexPath = join(chaptersDir, "index.json");
  if (existsSync(indexPath)) {
    try {
      const index = JSON.parse(readFileSync(indexPath, "utf8"));
      if (Array.isArray(index) && index.length > 0) {
        return Math.max(...index.map((chapter) => Number(chapter.number)).filter(Number.isFinite));
      }
    } catch {
      // fall through to filename scan
    }
  }

  const chapterNumbers = readdirSync(chaptersDir)
    .filter((name) => /^\d{4}_.+\.md$/i.test(name))
    .map((name) => parseInt(name.slice(0, 4), 10))
    .filter(Number.isFinite);

  if (chapterNumbers.length === 0) {
    return null;
  }
  return Math.max(...chapterNumbers);
}

const latestChapter = resolveLatestChapterNumber();
if (!latestChapter) {
  console.error(`[错误] 书籍 "${bookId}" 下没有找到章节文件。`);
  process.exit(1);
}

const cliEntry = join(root, "packages", "cli", "dist", "index.js");
if (!existsSync(cliEntry)) {
  console.error("[错误] CLI 未构建，请先执行: pnpm --filter @actalk/inkos build");
  process.exit(1);
}

console.log(`[同步] 书籍: ${bookId}`);
console.log(`[同步] 章节: 第 ${latestChapter} 章`);
console.log(`[同步] 说明: ${brief}`);
console.log("");

const syncResult = spawnSync(
  process.execPath,
  [cliEntry, "write", "sync", bookId, String(latestChapter), "--brief", brief],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(syncResult.status ?? 1);

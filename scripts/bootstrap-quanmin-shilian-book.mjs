#!/usr/bin/env node
/**
 * Bootstrap 《全民试炼》with pre-approved roles + book_rules,
 * then ask architect to generate only story_frame / volume_map / pending_hooks.
 */
import { readFile, writeFile, mkdir, rename, rm, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ArchitectAgent,
  PipelineRunner,
  StateManager,
  resolveEffectiveLLMConfig,
  loadLLMEnvLayers,
  isBookFoundationComplete,
  createLLMClient,
} from "../packages/core/dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BOOK_ID = "全民试炼-我f级天赋-靠剧情权重分碾压全场";
const TITLE = "全民试炼：我F级天赋，靠剧情权重分碾压全场";
const DRAFT_DIR = join(ROOT, "notes", "temp-quanmin-shilian-foundation-draft");
const BRIEF_PATH = join(ROOT, "notes", "quanmin-shilian-create", "brief.md");

function stripDraftHeader(text, header) {
  return text.replace(new RegExp(`^#\\s*${header}\\s*\\n+`, "i"), "").trim();
}

function parseRolesMarkdown(raw) {
  const roles = [];
  const majorBlock = raw.split(/##\s*主要角色/i)[1]?.split(/##\s*次要角色/i)[0] ?? "";
  const minorBlock = raw.split(/##\s*次要角色/i)[1]?.split(/^---\s*$/m)[0] ?? "";

  for (const block of majorBlock.split(/^###\s+/m).slice(1)) {
    const nl = block.indexOf("\n");
    const name = block.slice(0, nl).trim();
    const content = block.slice(nl + 1).trim();
    if (name && content) roles.push({ tier: "major", name, content });
  }

  for (const line of minorBlock.split("\n")) {
    const m = line.match(/^\*\*(.+?)\*\*[:：](.+)$/);
    if (!m) continue;
    const name = m[1].replace(/^"|"$/g, "").replace(/\(.*\)$/, "").trim();
    const content = m[2].trim();
    if (name && content) roles.push({ tier: "minor", name, content });
  }
  return roles;
}

async function loadConfig() {
  const envLayers = await loadLLMEnvLayers(ROOT);
  const resolved = await resolveEffectiveLLMConfig({
    consumer: "cli",
    projectRoot: ROOT,
    envLayers,
    requireApiKey: false,
  });
  return resolved.config;
}

function buildPipelineConfig(config, projectRoot) {
  return {
    client: createLLMClient(config.llm),
    model: config.llm.model,
    projectRoot,
    defaultLLMConfig: config.llm,
    foundationReviewRetries: config.foundation?.reviewRetries ?? 1,
    modelOverrides: config.modelOverrides,
    logger: {
      info: (...args) => console.log("[info]", ...args),
      warn: (...args) => console.warn("[warn]", ...args),
      error: (...args) => console.error("[error]", ...args),
      child: () => ({
        info: (...args) => console.log("[info]", ...args),
        warn: (...args) => console.warn("[warn]", ...args),
        error: (...args) => console.error("[error]", ...args),
      }),
    },
    onStreamProgress: (progress) => {
      if (progress.status === "streaming") {
        console.log(
          `[stream] ${Math.round(progress.elapsedMs / 1000)}s, ${progress.totalChars} chars`,
        );
      }
    },
  };
}

async function main() {
  const bookDir = join(ROOT, "books", BOOK_ID);
  try {
    await access(join(bookDir, "book.json"));
    console.error(`Book already exists: books/${BOOK_ID}/`);
    process.exit(1);
  } catch {
    // ok
  }

  const rolesRaw = stripDraftHeader(await readFile(join(DRAFT_DIR, "roles.md"), "utf8"), "roles");
  const bookRulesRaw = stripDraftHeader(await readFile(join(DRAFT_DIR, "book_rules.md"), "utf8"), "book_rules");
  const brief = await readFile(BRIEF_PATH, "utf8");
  const preservedRoles = parseRolesMarkdown(rolesRaw);

  const config = await loadConfig();
  const pipeline = new PipelineRunner(buildPipelineConfig(config, ROOT));
  const state = new StateManager(ROOT);
  const now = new Date().toISOString();

  const book = {
    id: BOOK_ID,
    title: TITLE,
    genre: "xuanhuan",
    platform: "tomato",
    language: "zh",
    status: "outlining",
    targetChapters: 240,
    chapterWordCount: 3000,
    createdAt: now,
    updatedAt: now,
  };

  const stagingBookDir = join(
    ROOT,
    "books",
    `.tmp-book-create-${BOOK_ID}-${Date.now().toString(36)}`,
  );

  console.log("[1/4] Calling architect (preserve roles + book_rules, fill missing sections)...");
  const architect = new ArchitectAgent(pipeline.createAgentContext("architect", BOOK_ID));
  const foundation = await architect.generateFoundation(
    book,
    brief,
    undefined,
    {
      reviseFrom: {
        storyBible: "",
        volumeOutline: "",
        bookRules: bookRulesRaw,
        characterMatrix: rolesRaw,
        userFeedback: [
          "roles 与 book_rules 已与用户审定，必须原样保留，禁止删改、缩略或重写。",
          "允许并保留：王倩感情线、陆铮妹妹线、沈清/林硕扩展线、系统真相/27轮回/观察者NPC/GM视角升级。",
          "你只需要补齐 story_frame、volume_map、pending_hooks 三块；roles 与 book_rules section 必须与输入完全一致。",
          "volume_map 写卷级散文，不要逐章任务列表。",
          "pending_hooks 使用 Phase 7 扩展列表格，含 3-7 条 core_hook。",
        ].join("\n"),
      },
    },
  );

  // Hard preserve approved drafts even if the model drifted.
  foundation.roles = preservedRoles;
  foundation.bookRules = bookRulesRaw;

  console.log("[2/4] Writing foundation files...");
  await state.saveBookConfigAt(stagingBookDir, book);
  await architect.writeFoundationFiles(stagingBookDir, foundation, true, "zh", "init");
  await writeFile(join(stagingBookDir, "story", "brief.md"), brief, "utf8");
  await writeFile(join(stagingBookDir, "story", "author_intent.md"), brief, "utf8");

  console.log("[3/4] Initializing control docs + snapshot...");
  await state.ensureControlDocumentsAt(stagingBookDir, "zh", brief);
  await state.saveChapterIndexAt(stagingBookDir, []);
  await state.snapshotStateAt(stagingBookDir, 0);

  try {
    await access(bookDir);
    await rm(bookDir, { recursive: true, force: true });
  } catch {
    // book dir absent
  }
  await rename(stagingBookDir, bookDir);

  console.log("[4/4] Verifying...");
  const complete = await isBookFoundationComplete(bookDir);
  if (!complete) {
    console.error("Foundation incomplete after bootstrap. Check books/" + BOOK_ID + "/story/");
    process.exit(1);
  }

  console.log("\nDone.");
  console.log(`  books/${BOOK_ID}/`);
  console.log("  Next: inkos write next " + BOOK_ID);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

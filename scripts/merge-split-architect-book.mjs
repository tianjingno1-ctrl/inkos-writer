#!/usr/bin/env node
/**
 * Two-pass architect → save partials → merge section maps → write (no repair LLM).
 */
import { readFile, writeFile, rm, rename, access, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  deriveBookIdFromTitle,
  normalizePlatformOrOther,
  PipelineRunner,
  ArchitectAgent,
  resolveEffectiveLLMConfig,
  loadLLMEnvLayers,
  createLLMClient,
  createLogger,
  createStderrSink,
  isBookFoundationComplete,
  StateManager,
  readGenreProfile,
} from "../packages/core/dist/index.js";

const ROOT = process.cwd();
const TITLE = "末世：我种的花，连丧尸都不敢靠近";
const BOOK_ID = deriveBookIdFromTitle(TITLE);
const BRIEF_PATH = "notes/moshi-zhiwu-create/brief.md";
const PARTIAL_DIR = "notes/moshi-zhiwu-create/partial";
const PART1_PATH = join(PARTIAL_DIR, "part1-story-volume.md");
const PART2_PATH = join(PARTIAL_DIR, "part2-roles-rules-hooks.md");
const MODEL = "[Kiro-量]claude-sonnet-4-6";

const brief = await readFile(join(ROOT, BRIEF_PATH), "utf8");
const secrets = JSON.parse(await readFile(join(ROOT, ".inkos/secrets.json"), "utf8"));

const { config } = await resolveEffectiveLLMConfig({
  consumer: "cli",
  projectRoot: ROOT,
  envLayers: await loadLLMEnvLayers(ROOT),
  cli: { service: "custom:k", model: MODEL, baseUrl: "https://juziapi.xin/v1" },
  requireApiKey: false,
});
config.llm.apiKey = secrets.services["custom:k"]?.apiKey;
config.llm.model = MODEL;
config.llm.baseUrl = "https://juziapi.xin/v1";
config.llm.service = "custom:k";

const logger = createLogger({ tag: "inkos", sinks: [createStderrSink({ minLevel: "info" })] });
const pipeline = new PipelineRunner({
  client: createLLMClient(config.llm),
  model: config.llm.model,
  projectRoot: ROOT,
  defaultLLMConfig: config.llm,
  logger,
  onStreamProgress: (p) => {
    if (p.status === "streaming") {
      logger.info(`streaming ${Math.round(p.elapsedMs / 1000)}s, ${p.totalChars} chars`);
    }
  },
});

const now = new Date().toISOString();
const book = {
  id: BOOK_ID,
  title: TITLE,
  genre: "末世系统种田",
  platform: normalizePlatformOrOther("tomato"),
  status: "outlining",
  targetChapters: 200,
  chapterWordCount: 3000,
  language: "zh",
  createdAt: now,
  updatedAt: now,
};

const architect = new ArchitectAgent(pipeline.createAgentContext("architect", BOOK_ID));
const { profile: gp, body: genreBody } = await readGenreProfile(ROOT, book.genre);
const contextBlock = `\n\n## 外部指令\n${brief}\n`;
const numericalBlock = "- 有明确的数值/资源体系可追踪\n- 在 book_rules 中写清核心资源、硬上限和不可突破规则";
const systemPrompt = architect.buildChineseFoundationPrompt(
  book, gp, genreBody, contextBlock, "", numericalBlock, "", "",
);

async function chatPass(extraSystem, userMessage, temperature = 0.75) {
  const response = await architect.chat([
    { role: "system", content: systemPrompt + extraSystem },
    { role: "user", content: userMessage },
  ], { temperature });
  return response.content.trim();
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function mergePartsToFoundation(part1, part2) {
  const m1 = architect.parseArchitectSectionMap(part1);
  const m2 = architect.parseArchitectSectionMap(part2);
  const keys = ["story_frame", "volume_map", "roles", "book_rules", "pending_hooks"];
  const merged = new Map();
  for (const key of keys) {
    const v = (m1.get(key) || m2.get(key) || "").trim();
    if (v) merged.set(key, v);
  }
  const missing = keys.filter((k) => !merged.get(k));
  if (missing.length > 0) {
    throw new Error(`合并后仍缺 section: ${missing.join(", ")}。请检查 ${PARTIAL_DIR}/ 里的 part1/part2。`);
  }
  const combined = keys.map((k) => `=== SECTION: ${k} ===\n\n${merged.get(k)}`).join("\n\n");
  // 直接 parse，不走 repair
  return architect.parseSections(combined, "zh");
}

let part1;
let part2;

if (await fileExists(PART1_PATH) && await fileExists(PART2_PATH)) {
  console.log("[load] 使用已保存的 partial …");
  part1 = await readFile(PART1_PATH, "utf8");
  part2 = await readFile(PART2_PATH, "utf8");
} else {
  console.log("[1/2] story_frame + volume_map → 保存 part1 …");
  part1 = await chatPass(
    "\n\n【分段·第1轮】只输出 === SECTION: story_frame === 和 === SECTION: volume_map ===。",
    `请为《${TITLE}》生成 story_frame 与 volume_map。`,
  );
  await mkdir(PARTIAL_DIR, { recursive: true });
  await writeFile(PART1_PATH, part1, "utf8");

  console.log("[2/2] roles + book_rules + pending_hooks → 保存 part2 …");
  part2 = await chatPass(
    "\n\n【分段·第2轮】只输出 === SECTION: roles ===、=== SECTION: book_rules ===、=== SECTION: pending_hooks ===。",
    `已有前半，请补齐后三段：\n\n${part1}`,
    0.7,
  );
  await writeFile(PART2_PATH, part2, "utf8");
}

console.log("[merge] 合并 section maps（无 repair）…");
const foundation = mergePartsToFoundation(part1, part2);

const state = new StateManager(ROOT);
const staging = join(ROOT, "books", `.tmp-book-create-${BOOK_ID}-${Date.now().toString(36)}`);
await rm(join(ROOT, "books", BOOK_ID), { recursive: true, force: true }).catch(() => {});

await state.saveBookConfigAt(staging, book);
await architect.writeFoundationFiles(staging, foundation, gp.numericalSystem, "zh", "init");
await writeFile(join(staging, "story", "brief.md"), brief, "utf8");
await writeFile(join(staging, "story", "author_intent.md"), brief, "utf8");
await state.ensureControlDocumentsAt(staging, "zh", brief);
await state.saveChapterIndexAt(staging, []);
await state.snapshotStateAt(staging, 0);
await rename(staging, join(ROOT, "books", BOOK_ID));

const ok = await isBookFoundationComplete(join(ROOT, "books", BOOK_ID));
if (!ok) {
  console.error("落盘后 foundation 仍不完整。");
  process.exit(1);
}
console.log(`Done: books/${BOOK_ID}/`);
console.log(`Partials kept at: ${PARTIAL_DIR}/`);

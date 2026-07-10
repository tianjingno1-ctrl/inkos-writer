#!/usr/bin/env node
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PipelineRunner,
  StateManager,
  resolveEffectiveLLMConfig,
  loadLLMEnvLayers,
  createLLMClient,
} from "../../packages/core/dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BOOK_ID = "被前夫抛弃后-我用毒草称霸末世";

const FEEDBACK = `【仅补全角色卡，其它地基尽量保持】

保留不动（剧情、卷纲、钩子逻辑）：
- story_frame / volume_map / book_rules 的核心设定与六卷结构
- pending_hooks 已有条目含义（H001–H007）
- 女主许蔓、男二陆霆的既有性格与关系定位

必须补齐 roles 一人一卡：
- **主要角色**：陈建宇（凤凰男前夫，火系异能，自卑转自大，陈家显性对手）
- **主要角色**：许振山（许蔓父亲，商界大佬，末世自建基地，后台「地球肺部重启」资助者）
- **次要角色**：陈母（婆婆，市侩贪婪，欺软怕硬）
- **次要角色**：陈小姑 / 小姑子（势利，觉醒战斗异能后变本加厉刁难许蔓）

要求：
- 许蔓.md、陆霆.md 保留现有核心标签/弧线，可微调措辞，不可改名或改人设方向
- 新角色卡格式与现有 Phase5 角色卡一致（核心标签、反差、小传、现状、关系网等）
- 不要引入与 brief 冲突的新设定；不要多男主；不要改书名`;

async function main() {
  const envLayers = await loadLLMEnvLayers(ROOT);
  const { config } = await resolveEffectiveLLMConfig({
    consumer: "cli",
    projectRoot: ROOT,
    envLayers,
    requireApiKey: true,
  });

  const state = new StateManager(ROOT);
  const runner = new PipelineRunner({
    state,
    projectRoot: ROOT,
    client: createLLMClient(config.llm),
    model: config.llm.model,
    defaultLLMConfig: config.llm,
    modelOverrides: config.modelOverrides,
    foundationReviewRetries: config.foundation?.reviewRetries ?? 2,
  });

  console.log(`Revising foundation for ${BOOK_ID}...`);
  await runner.reviseFoundation(BOOK_ID, FEEDBACK);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

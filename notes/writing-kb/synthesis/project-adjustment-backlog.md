# 项目调整待办（从操作观察提炼）

> **来源**：[observations/recent-operations.md](../observations/recent-operations.md) + session-log  
> **用途**：讨论「怎么建 Cursor 流程」「InkOS 改什么」时的**证据清单**  
> **原则**：只记**重复出现**或**用户明确抱怨**的项；单次意外不进 backlog

**状态**：观察期 · 2026-07-03 初版（样本偏工厂文 + 口述，InkOS 写章链待补）

---

## 优先级说明

| 级别 | 含义 |
|------|------|
| P0 | 每次都痛，阻塞效率 |
| P1 | 频繁摩擦，有 workaround |
| P2 | 优化项，观察够了再动 |

---

## InkOS 产品 / 流水线

| ID | 问题 | 证据 | 建议方向 | 优先级 |
|----|------|------|----------|--------|
| I-01 | 改稿上下文过大，规则淹没模型，贵且改不动 | 用户口述；工厂文弃用 `run-step` 整章 API | 改稿模式：**只收正文+短指令**；与写章模式分离 | P0 |
| I-02 | Cursor 改完正文，state/伏笔不自动更新 | 用户口述标准流 | 导出「本章 diff + 待更新 state 字段」；或 Cursor 改后一键回写 hook | P0 |
| I-03 | 用户需盯 InkOS 终端完成/报错 | 用户 09:41 诉求 | `PRODUCTION.md` 式单文件状态；或 Studio 完成通知 | P1 |
| I-04 | 短篇定稿后扩写上架路径不在 `shorts/` 内 | 工厂文在 `notes/` 跑通 | 明确「notes 母版流」vs「shorts pipeline」两条产品路径 | P1 |
| I-05 | 封面/上架包后处理无内置 | 工厂文手写脚本链 | 上架 checklist + cover fix 进 short-fiction-runner 可选步 | P2 |

---

## Cursor 流程 / 仓库约定

| ID | 问题 | 证据 | 建议方向 | 优先级 |
|----|------|------|----------|--------|
| C-01 | 工具切换多，人在中间当胶水 | 用户全天口述 | 单 Agent 生产话术 + `PRODUCTION.md`；写→改→回写 state 一条指令 | P0 |
| C-02 | 母版/中间稿混用导致钩子丢失 | 工厂文 HOOKS-RESTORE | Rule：**唯一真源**路径；扩写前强制确认母版 | P0 |
| C-03 | 豆包润色脚本要记多命令 | 工厂文 5 批 polish + 5 批 format | 封装 `polish-all.mjs` 或 Makefile；进度写 PRODUCTION | P1 |
| C-04 | 跨对话失忆 | 用户 09:46 顾虑 | `writing-kb` + 新对话 @ INDEX（已建，需坚持用） | P1 |
| C-05 | format 副作用（章首【】） | 工厂文发布前手工删 | format prompt 固化 + export 后 lint 检查 | P1 |
| C-06 | 封面比例不可信 | 多次横图 | 封面流程强制 `fix-cover-fanqie.mjs`（已脚本化） | P1 |

---

## 写作习惯 / KB（不改代码也能做）

| ID | 问题 | 证据 | 建议方向 | 优先级 |
|----|------|------|----------|--------|
| K-01 | A/B InkOS vs Cursor 写章未开始 | Day 0 待办 | 网恋AI 相邻两章试写 | P0 |
| K-02 | 观察样本只有工厂文（非标准 InkOS 流） | recent-operations | 补 1 条 InkOS 写章完整链 | P0 |
| K-03 | 满意 prompt 未全进 retained | 部分在 session | 推断记录继续；用户问时可查 | P2 |

---

## 已验证有效的做法（保留，非待办）

| 做法 | 场景 | 出处 |
|------|------|------|
| 豆包润色：短语 + 正文，2章/批 | 番茄女频语感 | 工厂文 · 用户「可以可以就这样」 |
| 定点插入补钩/补字 | 扩写 | tasks.json / E01–E12 |
| 汉子茶式短段 format | 刷读感 | format 阶段 |
| 火花素材查节拍，非逐步清单 | 规划 | huohua-audit 原则 |
| 角色卡+圆桌作增强模块 | 复杂章 | 09:xx 架构讨论 |

---

## 讨论入口（你说「可以总结了」时用）

1. 读 [recent-operations.md](../observations/recent-operations.md) 几条操作链  
2. 本表 P0 项是否仍成立  
3. 定稿：`workflow-patterns.md`（Cursor 侧）+ 可选 InkOS issue 列表  
4. A/B 结论：`ab-conclusion.md`（若已试）

---

## 变更日志

| 日期 | 变更 |
|------|------|
| 2026-07-03 | 初版：工厂文完整循环 + 用户口述痛点 |

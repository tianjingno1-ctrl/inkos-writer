# 写作知识库（Writing KB）

可维护的个人写作知识库：**记录实际操作 → 沉淀偏好与提示词 → 定期总结 → 反哺 Cursor 流程**。

不是代码项目，全是 Markdown，你可以随时改、删、合并。

---

## 目录结构

| 路径 | 用途 |
|------|------|
| `INDEX.md` | 总索引：有哪些书、类型、当前 A/B 结论 |
| **`observations/`** | **最近真实操作流程**（跨书），为项目调整打底 |
| `session-log/` | **操作流水**（按次 raw），Agent 从自然反馈推断追加 |
| `books/` | **每本书**的写法、工具选择、摩擦点、定稿偏好 |
| `genres/` | **类型书**共性（番茄短篇、豪门反转等） |
| `prompts/` | 提示词库：草稿 → 试用 → 留存的进 `retained.md` |
| `phrases/` | 你最爱用的改稿说法、保留句式、禁用表达 |
| `materials/` | **火花素材**索引（本地 cache + API 沉淀区） |
| `research/`（`notes/research/`） | **题材验证**、火花 API 摘抄 |
| `ab-test/` | InkOS 写 vs Cursor 写 对比记录 |
| `synthesis/` | 阶段性总结（你说「可以总结了」时由 Agent 写） |

---

## 你怎么用（最少参与）

### 日常：像正常聊天就行

不用背关键词。你照常写、改，**自然反馈**我就会判断要不要记：

| 你可能说 | 我会记什么 |
|----------|------------|
| 「这章不错」「这次改好了」「定稿」 | **场景 + 提示词/改法** → `prompts/retained.md`（不只抄一句 prompt） |
| 「还是太 AI」「改坏了」「InkOS 发太多反而差」 | **失败场景 + 教训** → retained「避免」或 session |
| 「对话再狠点」（且满意） | → `phrases/常用改稿说法.md` |
| 换工具、等终端、sync state 烦 | → session 摩擦 |
| 「这题材能写 / 不想写了」 | → 题材验证 |

写入后**一般不会打断你**；你要确认时说「KB 里记了啥」即可。

### 关键词（可选，说了就强制记）

- **记一下** — 强制 session  
- **这条提示词留着** — 强制 retained（仍带场景）  
- **可以总结了** / **总结 A/B** — 阶段性汇总  

Agent 按 `.cursor/rules/writing-knowledge-base.mdc` 维护。

### A/B 试 InkOS vs Cursor

每写完一章（或一本短篇的一轮），在 `ab-test/log.md` 里会有一条记录，字段：

- 写作工具：InkOS / Cursor
- 改稿工具：Cursor / 豆包 / …
- 耗时、报错、上下文感受、定稿满意度（1–5）

**试 2～3 章后**说「总结 A/B」，Agent 写进 `synthesis/ab-conclusion.md`。

### 定期总结

每 **5～10 条 session** 或 **你说「可以总结了」**：

Agent 读 `session-log/` + `books/` + `prompts/retained.md`，输出到 `synthesis/workflow-patterns.md`：

- 重复步骤（可自动化）
- 重复提示词（可进 Rule）
- 重复摩擦（要改流程）

---

## 与 Cursor / InkOS 项目调整的关系

书稿目录（`shorts/`、`novels/`、`inbox/`）见 [`notes/README.md`](../README.md)。

```
你照常操作（InkOS 写、Cursor 改、跑脚本…）
        ↓
observations/recent-operations.md（跨书操作链）
        ↓
session-log + books + prompts（结构化沉淀）
        ↓
synthesis/project-adjustment-backlog.md（摩擦 → 待改项）
        ↓
synthesis/workflow-patterns.md（你说「可以总结了」）
        ↓
.cursor/rules / InkOS 产品改动
```

知识库是**中间层**：比聊天持久，比写项目轻；**观察层**比单本书 SOP 更上层。

---

## 新建一本书

复制 `books/_template.md` → `books/<书名或 slug>.md`，在 `INDEX.md` 加一行链接。

# 写作知识库索引

> **新对话**：`@notes/writing-kb/INDEX.md` +「接着 KB / 观察 / 改《书名》」  
> **发新书**：先丢 [`inbox/`](../inbox/README.md)，再说「整理 inbox + 建 KB 卡」  
> 最后更新：2026-07-03（快穿 Ch6–8 改稿链入库 + 濒死拳台）

## 新对话起手式（复制即用）

新对话不会带上旧聊天，靠 **@ 文件 + 一句意图** 续上。

### 最省事（日常接着写/改）

```
@notes/writing-kb/INDEX.md

接着写作知识库。今天我要 [写章/改稿/上架/试 InkOS]，
书是《xxx》。请按 observations 记录操作链，自然反馈也记 KB。
```

### 接着观察、记操作流程

```
@notes/writing-kb/observations/recent-operations.md
@notes/writing-kb/INDEX.md

接着操作观察。我接下来会 InkOS 写 + 你来改，
请记录我怎么切工具、等什么、手动 sync 了什么，
摩擦更新到 project-adjustment-backlog。
```

### 发一本新书（短篇或长篇）

```
@inbox/README.md
@notes/writing-kb/INDEX.md

我把新书放在 inbox 了，请整理归档并建 KB 卡。
短篇 / 长篇：[说明]
```

### 改某一本书

```
@notes/writing-kb/books/网恋AI弹窗断线.md
@notes/writing-kb/INDEX.md

改《网恋AI弹窗断线》第 N 章。[你的改稿要求]
```

工厂文已发布，一般不用每天 @，除非还要改上架包：

```
@notes/writing-kb/books/全网看我-螺丝女工干翻天才前男友.md
母版是 notes/temp-revised-story-final.md，别用 factory-story-expand 当中稿。
```

### 几天后要总结、定 Cursor 流程

```
@notes/writing-kb/observations/recent-operations.md
@notes/writing-kb/synthesis/project-adjustment-backlog.md
@notes/writing-kb/session-log/

可以总结了：根据最近操作，写 workflow-patterns，
并列出 InkOS / Cursor 该怎么改。
```

### A/B 试 InkOS vs Cursor 写章

```
@notes/writing-kb/ab-test/log.md
@notes/writing-kb/books/网恋AI弹窗断线.md

A/B：这章用 InkOS 写，下一章用 Cursor 写，改稿都用你。
每章结束记 ab-test + observations。
```

### 你几乎不用说的

Agent 会按 `.cursor/rules/writing-knowledge-base.mdc` 自己做：

- 「记一下」— 可不说了，自然反馈也会记
- 「这条提示词留着」— 你说「可以了」「就这样」也会进 retained
- 每次操作后更新 `recent-operations.md` — 你说「接着观察」时会做

## 文件布局（书稿 vs 知识）

| 放什么 | 路径 | 说明 |
|--------|------|------|
| **新书收件** | [`inbox/`](../inbox/README.md) | 聊天里发的稿先放这里，再说「整理」 |
| **短篇正文** | [`shorts/`](../shorts/README.md) | InkOS 管线；每书 `drafts/` + `final/` |
| **长篇正文** | [`novels/`](../novels/README.md) | 新建 `_template` 复制即用 |
| **写法 / 流程** | `writing-kb/`（本目录） | 知识卡、提示词、观察 |
| **历史废稿** | [`notes/archive/`](../archive/README.md) | v1–v6 等，勿当定稿 |
| **选题 / 火花** | [`notes/research/`](../research/README.md) | 题材验证、huohua-api-temp |
| **工厂文脚本** | `notes/factory-story-expand/` | 仅《全网看我》上架流水线 |

导航总表：[`notes/README.md`](../README.md)

## 今日 Session

- [2026-07-03 完整流水](session-log/2026-07-03.md) — KB 搭建、汉子茶、工厂文发布、**快穿 Ch6–8 InkOS→Cursor 改稿链**

## 最初目标（Day 0 · 你定的方案）

> **观察真实操作 → 记重复步骤 → 总结方案 → 为未来 InkOS / Cursor 项目调整做基础**

- **操作观察**：[observations/recent-operations.md](observations/recent-operations.md) ← **主入口**
- **项目调整待办**：[synthesis/project-adjustment-backlog.md](synthesis/project-adjustment-backlog.md)
- **A/B**：InkOS 写 vs Cursor 写 → [ab-test/log.md](ab-test/log.md)
- **可维护 KB**：session / books / prompts / phrases → 重复步骤沉淀到 [synthesis/](synthesis/)
- 减少切换；改稿少上下文；自然反馈推断记录

## 已发布 / 定稿的书

| 书 | 类型 | 正文位置 | 知识卡 |
|----|------|----------|--------|
| **全网看我：螺丝女工干翻天才前男友** | 番茄女频 / 重生打脸 | `notes/temp-revised-story-final.md` | [books/…](books/全网看我-螺丝女工干翻天才前男友.md) |
| **黑拳濒死：我姐藏的录音笔牵出大案**（濒死拳台） | 番茄短篇 / 拳台悬疑 | `shorts/濒死拳台/final/` | [books/濒死拳台.md](books/濒死拳台.md) |
| **拿我女儿逼我顶罪？刑辩律师我不装了** | 番茄短篇 / 刑辩复仇 / 崽崽 | `shorts/刑辩律师我不装了/drafts/v001/` | [books/刑辩律师我不装了.md](books/刑辩律师我不装了.md) |

## 进行中的书

| 书 | 类型 | 当前 draft | 正文位置 | 知识卡 |
|----|------|------------|----------|--------|
| **网恋AI弹窗断线** | 番茄短篇 / 身份反转 | v004 · 10 章 | `shorts/网恋AI弹窗断线/drafts/v004/` | [books/网恋AI弹窗断线.md](books/网恋AI弹窗断线.md) |

## 类型模板

| 类型 | 知识卡 |
|------|--------|
| 番茄短篇（通用） | [genres/番茄短篇.md](genres/番茄短篇.md) |
| 汉子茶 / 恶女横刀夺爱 | [genres/汉子茶恶女.md](genres/汉子茶恶女.md) |

## 已归档的书

| 书 | 类型 | 素材位置 | 知识卡 |
|----|------|----------|--------|
| **快穿：软妹炮灰把疯批男主钓疯了** | 快穿甜爽 / 番茄女频 | [`notes/archive/kuaihuan-soft-paohui/`](../archive/kuaihuan-soft-paohui/) | [books/…](books/快穿-软妹炮灰把疯批男主钓疯了.md) |

## 素材与研究

| 用途 | 入口 |
|------|------|
| 火花本地缓存 + 标签索引 | [materials/spark-cache.md](materials/spark-cache.md) |
| 素材层说明 & Agent 判断 | [materials/README.md](materials/README.md) |
| 题材验证（P0/P1/P2） | [research/genre-validation.md](research/genre-validation.md) → [`notes/research/番茄新书题材验证.md`](../research/番茄新书题材验证.md) |
| 火花 API 源文件 | [`notes/research/huohua-api-temp/`](../research/huohua-api-temp/) |
| 整书参考摘抄 | [materials/ref-小团体里的汉子茶.md](materials/ref-小团体里的汉子茶.md) |

## 提示词

- [留存提示词（定稿）](prompts/retained.md)
- [提示词模板](prompts/_template.md)

## 改稿语言

- [常用改稿说法](phrases/常用改稿说法.md)

## A/B 对比

- [对比日志](ab-test/log.md)
- 结论（试完后填）：`synthesis/ab-conclusion.md`

## 流程总结

- **[最近操作流程观察](observations/recent-operations.md)** ← 跨书操作链，为项目调整打底
- **[项目调整待办](synthesis/project-adjustment-backlog.md)** ← 摩擦 → InkOS / Cursor 改什么
- [工厂文完整流程](synthesis/factory-story-workflow.md) ← 一次完整循环样本
- 操作手册：`notes/factory-story-expand/WORKFLOW-短篇改写全流程.md`
- （待）通用模式：[synthesis/workflow-patterns.md](synthesis/workflow-patterns.md) — 说「可以总结了」后生成

## Session 流水

- [2026-07-03 完整流水](session-log/2026-07-03.md)

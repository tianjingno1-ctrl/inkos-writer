# 操作观察层（Observations）

> **目的**：记录你**最近真实怎么操作**（切工具、等什么、手动补什么），不是为了记一本书，而是为了**几天后总结 → 定 Cursor 流程 → 反哺 InkOS 项目调整**。

这是 KB 里**最上层**的「为什么记」：

```
你照常写/改（InkOS、Cursor、豆包、终端…）
        ↓
session-log（按次流水，raw）
        ↓
recent-operations.md（跨书操作时间线 + 重复步骤）
        ↓
project-adjustment-backlog.md（摩擦 → 改 InkOS / 改 Cursor / 改习惯）
        ↓
synthesis/workflow-patterns.md（定稿流程草案）
        ↓
.cursor/rules / InkOS 产品改动
```

## 文件

| 文件 | 用途 |
|------|------|
| [recent-operations.md](recent-operations.md) | **主文件**：按时间记录操作步骤、工具切换、等待点、你手动做了什么 |
| [project-adjustment-backlog.md](../synthesis/project-adjustment-backlog.md) | 从摩擦提炼的**待改项**（InkOS / Cursor / 脚本 / 目录约定） |

## Agent 维护规则

每次完成一轮有意义的写作/改稿后，除 `session-log` 外，**同步更新** `recent-operations.md` 一条「操作链」：

- 触发了什么（定稿 / 扩写 / 润色 / 上架…）
- 用了哪些工具（InkOS Studio / Cursor Agent / 豆包脚本 / 手工…）
- 你在中间**手动**做了什么（sync state、盯终端、复制粘贴、选母版…）
- 摩擦点（重复出现的才升格到 backlog）

用户说 **「可以总结了」** 时：读 observations + session → 写 `workflow-patterns.md`，并刷新 backlog 优先级。

## 与用户最初方案的关系

用户原话（2026-07-03 09:46）：

> 我接下来操作 InkOS 写不同小说，然后操作你修改，你看看我的操作步骤记录下来，做几天事情，你再总结分析，我们再讨论怎么建立 Cursor 的流程。

后演进为 **D：A/B + 可维护 KB**，但**观察真实操作**仍是根基——本书 SOP（factory-story-workflow）只是**一次完整循环的样本**，不能替代跨书观察。

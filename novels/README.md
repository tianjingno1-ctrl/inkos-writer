# 长篇书稿

与 `shorts/`（短篇）并列。**InkOS 短篇管线不动**；长篇、连载、外站导入的书放这里。

## 新建一本书

1. 复制 `_template/` → `novels/<slug>/`（slug 用简短中文或拼音，如 `豪门复仇`）
2. 把大纲、章节放进 `outline/`、`drafts/v001/chapters/`
3. 新对话：

```
@novels/<slug>/
@notes/writing-kb/INDEX.md

新建长篇《xxx》知识卡，接着写 / 改第 N 章。
```

或先把文件丢进 [`inbox/`](../inbox/README.md)，让 Agent 整理过来。

## 目录约定

| 路径 | 用途 |
|------|------|
| `outline/` | 大纲、人设、世界观 |
| `drafts/v00N/` | 迭代稿；`chapters/` 分章，`full.md` 合并版 |
| `final/` | 定稿、上架包、封面 prompt |

## 当前书目

| 书 | 状态 | 知识卡 |
|----|------|--------|
| （暂无） | — | — |

> 有书后 Agent 更新此表，并同步 `notes/writing-kb/INDEX.md`。

# 新书收件箱

你从聊天里发给我的**新书稿、大纲、整本 txt**，先放这里。Agent 会帮你归档到正确位置并建知识库卡。

## 怎么用

1. 把文件丢进 `inbox/`（或子文件夹，如 `inbox/某书名/`）
2. 新对话里说：

```
@inbox/README.md
@notes/writing-kb/INDEX.md

整理 inbox 里的《书名》。
短篇 → shorts/，长篇 → novels/，并建 writing-kb 知识卡。
```

## 归档规则

| 类型 | 去向 | 知识卡 |
|------|------|--------|
| 番茄短篇 / InkOS 管线 | `shorts/<slug>/` | `notes/writing-kb/books/<书名>.md` |
| 长篇 / 连载 | `novels/<slug>/` | 同上 |
| 已有书的新章节 | 对应书的 `drafts/` 或 `inbox/` 暂存后合并 | 更新已有 books 卡 |
| 纯参考 / 废稿 | `notes/archive/` | 一般不建卡 |

## 单书标准结构（归档后）

**短篇**（与 InkOS 一致）：

```
shorts/<slug>/
  outline/
  drafts/v001/
  final/          ← 定稿、上架包、封面
```

**长篇**：

```
novels/<slug>/
  outline/
  drafts/v001/chapters/
  final/
```

## 当前内容

（Agent 整理后会清空或移走；此处仅作临时堆叠）

# 短篇书稿（shorts/）

InkOS 短篇管线的主目录。每本书一个文件夹，结构尽量统一。

## 标准结构

```
shorts/<slug>/
  outline/v001.md       ← 可选
  drafts/v00N/
    full.md
    chapters/0001.md …
    *-作家平台.txt      ← 上传稿
  final/                ← 定稿 + 上架包（已发布的书）
    full.md
    sales-package.json
    cover-prompt.md
```

## 书目总览

| slug | 上架名 | 状态 | 定稿 | 知识卡 |
|------|--------|------|------|--------|
| `濒死拳台` | 黑拳濒死：我姐藏的录音笔牵出大案 | **已发布** | [`final/`](濒死拳台/final/) | [KB](../notes/writing-kb/books/濒死拳台.md) |
| `网恋AI弹窗断线` | 56块装AI断线，我砸千万扒出堂姐毒计 | **改稿中** v004 ← 当前 | drafts/v004 | [KB](../notes/writing-kb/books/网恋AI弹窗断线.md) |
| `刑辩律师我不装了` | 拿我女儿逼我顶罪？刑辩律师我不装了 | **已发布** | drafts/v001 | [KB](../notes/writing-kb/books/刑辩律师我不装了.md) |
| `全网看我-螺丝女工干翻天才前男友` | 全网看我：螺丝女工干翻天才前男友 | **已发布** | 见 [README](全网看我-螺丝女工干翻天才前男友/README.md) | [KB](../notes/writing-kb/books/全网看我-螺丝女工干翻天才前男友.md) |

> 《全网看我》定稿仍在 `notes/temp-revised-story-final.md`（历史原因）；脚本在 `notes/factory-story-expand/`。

## 新建短篇

- **InkOS 里开**：直接在 `shorts/` 下建目录即可。
- **聊天里发整本**：先丢 [`inbox/`](../inbox/README.md)，再说「整理进 shorts + 建 KB 卡」。

## 长篇

→ [`novels/`](../novels/README.md)

# 素材层（Materials & Research）

火花素材、题材验证与写作 KB 的关系：

```
火花 API（实时检索）  ──检索后可选沉淀──►  spark-cache.md / genres /
        ▲                                      │
        │                                      ▼
   本地缓存 notes/research/huohua-api-temp/     books/（本书用了哪些素材）
        ▲
        │
题材验证 notes/research/番茄新书题材验证.md ◄──试写结论── session-log / books/
```

**原则**：原文件不搬家，KB 做**索引 + 沉淀 + 判断规则**。Agent 维护，你只管写书和说「记一下」。

---

## 文件对照

| 类型 | 源文件（不动） | KB 入口 |
|------|----------------|---------|
| 火花本地缓存 | `notes/research/huohua-api-temp/*.md` | [spark-cache.md](spark-cache.md) |
| 题材验证清单 | `notes/research/番茄新书题材验证.md` | [../research/genre-validation.md](../research/genre-validation.md) |
| 火花 API 实时检索 | huohua-novel-creation skill | Agent 按需调用，好结果沉淀到 spark-cache |

---

## Agent 何时用什么（判断表）

| 场景 | 优先 |
|------|------|
| 写番茄短篇、要桥段/文风参考 | 先查 `spark-cache.md` 标签是否命中 |
| 本地 cache 没有或要更新 | 调火花 API（huohua skill），**用户说「沉淀素材」** 时摘要写入 spark-cache |
| 开新书、选题 | 读 `research/genre-validation.md` → 源清单 |
| 某题材试写完成 | 更新源清单「验证记录」+ KB 验证日志 + 对应 `books/` |
| 本书用了某桥段 | 在 `books/<书名>.md` 记「已用素材」，避免重复套路 |

---

## 沉淀格式（新火花素材进 KB）

追加到 `spark-cache.md`：

```markdown
### [简短名] · #标签1 #标签2
- **来源**：火花 API / 手动
- **用途**：开篇 / 中后段 / 人设 / 文风
- **摘要**：一句话
- **原文**：`notes/research/huohua-api-temp/…` 或 API 检索 purpose
```

---

## 你几乎不用管

- 写《网恋AI》时 Agent 会自动关联 `#身份反转` `#网恋` 类 cache
- 试完一个题材说 **「题材验证记一下」** → 更新验证清单 + research 日志
- 火花搜到好素材说 **「沉淀素材」** → 进 spark-cache

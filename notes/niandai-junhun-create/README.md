# 《重生闪婚首长，婆家悔哭了》→ InkOS 写作流程

> **流程**：阶段 5 滚动写章 + 极短段定稿习惯  
> **bookId**：`重生闪婚首长-婆家悔哭了`  
> **节拍权威**：`CH01-04-LOCK.md` + `brief.md`

---

## LLM（CLI 默认 · apifast Gemini 2.5 Pro）

项目 `.env` 已配置：

| 变量 | 值 |
|------|-----|
| `INKOS_LLM_BASE_URL` | `https://api.apifast.tech/v1` |
| `INKOS_LLM_MODEL` | `gemini-2.5-pro` |
| `INKOS_LLM_API_KEY` | 同 `INKOS_APIFAST_KEY`（勿提交 git） |

**直接跑**（项目根目录）：

```powershell
npx inkos write next 重生闪婚首长-婆家悔哭了 --context "第N章，按 LOCK"
```

**显式走 apifast 包装脚本**（不依赖 .env 默认块）：

```powershell
node scripts/inkos-apifast-gemini.mjs write next 重生闪婚首长-婆家悔哭了 --context "…"
```

**单次 CLI 参数**（不改 .env）：

```powershell
npx inkos write next <bookId> --base-url https://api.apifast.tech/v1 --model gemini-2.5-pro --api-key-env INKOS_APIFAST_KEY
```

连通性：`npx inkos doctor`

## 每章标准流程

```
1. 读 notes/niandai-junhun-create/CH01-04-LOCK.md（对应章）
2. 读 books/…/story/current_focus.md
3. inkos plan chapter 重生闪婚首长-婆家悔哭了 --context "第N章，按 LOCK"
4. inkos write next 重生闪婚首长-婆家悔哭了 --context "…"
5. 手改定稿：极短段 · 双引号 · 活世界侧写
6. inkos audit 重生闪婚首长-婆家悔哭了 N
7. 满意 → inkos review approve … N → 下一章
```

## 格式与规则文件

| 用途 | 路径 |
|------|------|
| 章节排版 | `.cursor/rules/niandai-junhun-chapter-format.mdc` |
| 活世界 / 群像 | `.cursor/rules/world-ensemble-living.mdc` |
| 文风定调 | `books/…/story/style_guide.md` 顶部 |
| 书级禁写 | `books/…/story/book_rules.md` |
| 当前进度 | `books/…/story/current_focus.md` |

## 本书特有

- 单章 2500–3500 字；章章有硬结果
- 无空间/灵泉/萌宝；男主前 3 章不本人出场
- 年代锚 1976；对话战 + público 打脸节奏见 LOCK

## 验收（每章）

- [ ] LOCK 事件链未改
- [ ] 极短段 + 段间空行
- [ ] 群像/生活场景有「世界先转」侧写（见 world-ensemble-living）
- [ ] audit 无年代/设定硬冲突
- [ ] review approve 后再写下一章

# 短篇改写全流程 ·《全网看我：螺丝女工干翻天才前男友》

> **状态**：已发布修改版（2026-07-03）  
> **知识库总录**：[notes/writing-kb/synthesis/factory-story-workflow.md](../writing-kb/synthesis/factory-story-workflow.md)（含最初 `tasks.json` / E01–E12 方案）  
> **书卡**：[notes/writing-kb/books/全网看我-螺丝女工干翻天才前男友.md](../writing-kb/books/全网看我-螺丝女工干翻天才前男友.md)  
> **工作目录**：`notes/factory-story-expand/`  
> **母版定稿**：`notes/temp-revised-story-final.md`  
> **上架 txt**：`notes/全网看我-螺丝女工干翻天才前男友.txt`

---

## 0. 原则（踩坑总结）

| ✅ 要做 | ❌ 别做 |
|--------|--------|
| 以用户最新定稿为 **唯一母版** | 不要用 `work/latest.md`、扩写 txt 当母版 |
| **定点插入**补情节/钩子 | 不要用 `run-step.mjs` **整章**丢给 API 重写 |
| 豆包：**短语 + 正文**，每次 **2 章** | 不要写一长串「润色师/硬性约束」prompt |
| 简介定稿 **不改** | format 阶段 **不要**在 `02.`/`03.` 后加【】章首预告 |
| 封面后处理 **强制 600×800** | 不要信文件名或模型 prompt 的比例 |

参考钩子对照：`HOOKS-RESTORE.md`（web 豆包炸裂钩 vs 扩写基线混用问题）

---

## 1. 定稿与结构

**母版内容**

- 简介（213 字，含错字烙印 / 23 号工位 / 大国精工）
- 备选书名 ×5
- 正文 10 段：`01.` … `10.`（**无章标题**）
- 开篇钩子（正文最前，保留）：
  - `【小偷偷来的荣光……】`
  - `重生睁眼的第一秒……`
- 场景内 **弹幕【】** 保留；**章首预告【】** 已删除

**10 章剧情骨架**（豆包节拍表）：`doubao-tomato-10chapters.md`

---

## 2. 流程总览（= 最初方案）

```
母版定稿
  → 火花增量 tasks.json（单点插入，01–09）
  → 手工补钩 E01–E12
  → 豆包 10 章审读（可选）
  → 手工按章补字
  → 豆包润色（短语+正文，2章/批）
  → format（2章/批，禁章首【】）
  → export-pack（01.+开篇钩子）
  → 删章首【】
  → 封面 fix 600×800
  → 发布 → 记入 writing-kb
```

---

## 3. 分步操作

### 3.0 阶段 A · 火花增量（`tasks.json`）

- 查火花：`notes/research/huohua-api-temp/` 或 huohua skill
- 每步 **一个插入点** + 节拍标签（见 `tasks.json` 各条 `huohua` 字段）
- 状态追踪：`tasks.json`（01–09 等，全部 `done`）
- ⚠️ 早期 `run-step.mjs` 已弃用 **整章 API** → 改 Cursor 手工定点插入

### 3.0b 阶段 B · 手工补钩（`tasks-e.json` E01–E12）

- 对照 `HOOKS-RESTORE.md` + `notes/archive/factory-story/versions/temp-revised-story-web-doubao.md`
- 定点写入母版；勿用错扩写基线（钩子会丢）

### 3.0c 阶段 C · 豆包 10 章审读（可选）

```bash
node notes/factory-story-expand/run-doubao-tomato-structure.mjs
```

产出：`doubao-tomato-10chapters.md`

### 3.1 手工补字 / 补钩子（不改剧情走向）

- 在 `temp-revised-story-final.md` **定点插入**
- 优先补薄段：第 4 章埋坑、第 7–8 章炸场铁证等
- 同步：`notes/全网看我-螺丝女工干翻天才前男友.txt`

### 3.2 豆包 2.0 Pro · 番茄语感润色（每次 2 章）

```bash
node notes/factory-story-expand/run-doubao-polish-chapters.mjs 1 2
node notes/factory-story-expand/run-doubao-polish-chapters.mjs 3 4
# … 5 6 / 7 8 / 9 10
```

- 模型默认：`doubao-seed-2-0-pro-260215`
- **User 消息 = 默认短语 + 正文**，无 system、无角色设定
- 默认短语：  
  `在不改变剧情的情况下，可以加一些炸裂的点或者把一些句子，描述，文风换成更适合番茄女频的，然后用对白的感觉吧`
- 自定义短语：第 4 个参数起  
  `node …/run-doubao-polish-chapters.mjs 1 2 你的短语`
- 产出：`polish/ch01-02-doubao-pro.md` … → 合并 `polish/all-doubao-pro.md`

### 3.3 句式 / 分段 format（每次 2 章）

```bash
node notes/factory-story-expand/run-doubao-polish-chapters.mjs 1 2 format
# … 至 9 10
```

- 读入：`polish/all-doubao-pro.md`
- 参考番茄刷读分段（短段 + 对白），**不要**在章号后加【】预告金句
- 产出：`polish/format/chXX-YY-format.md`

### 3.4 合并上架包

```bash
node notes/factory-story-expand/export-pack.mjs
```

- 10 章 → `01.` … `10.`，去掉 `# 第X章 标题`
- 保留开篇钩子 + 去掉第 1 章内重复的楔子
- 写入：`temp-revised-story-final.md`（正文段）、`全网看我-螺丝女工干翻天才前男友.txt`

### 3.5 删章首【】预告（发布后修正）

format 会在 `02.` 后自动加【】金句 → **读起来怪**，需删：

- 删：`02.`～`10.` 后单独占行的【】预告
- 留：开篇钩子、签约会/直播 **弹幕【】**、行内弹幕、自动回复【】
- 陆铮两句若被拆成单独【】行 → 合并进相邻「」对白，不丢字

改完同步 txt：

```bash
node -e "
const fs=require('fs');
const p='notes/temp-revised-story-final.md';
const t=fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const body=t.slice(t.indexOf('## 正文\n')+'## 正文\n'.length).trim();
fs.writeFileSync('notes/全网看我-螺丝女工干翻天才前男友.txt',
  '全网看我：螺丝女工干翻天才前男友\n\n'+body+'\n');
"
```

### 3.6 番茄封面（600×800）

1. 写 prompt：`cover-prompt.md`（模板见 `shorts/濒死拳台/final/cover-prompt.md`）
2. 出图后 **必跑**：

```bash
node notes/factory-story-expand/fix-cover-fanqie.mjs notes/factory-story-expand/cover-source.png
```

- 任意比例 → 居中裁 **3:4** → **600×800**
- 产出：`cover-fanqie-600x800.png`、`cover.png`
- API 封面（kkaiapi 等）：`node notes/factory-story-expand/run-cover.mjs`（脚本内已接 fix）

---

## 4. 上架包清单（发布版）

| 资产 | 路径 |
|------|------|
| 定稿 md | `notes/temp-revised-story-final.md` |
| 上传 txt | `notes/全网看我-螺丝女工干翻天才前男友.txt` |
| 封面 600×800 | `notes/factory-story-expand/cover-fanqie-600x800.png` |
| 封面 prompt | `notes/factory-story-expand/cover-prompt.md` |
| 索引 | `notes/factory-story-expand/sales-package.json` |

---

## 5. 脚本索引

| 脚本 | 用途 |
|------|------|
| `run-doubao-polish-chapters.mjs` | 豆包润色 / format（第 4 参 `format`） |
| `export-pack.mjs` | format 批次 → 01. 上架正文 |
| `fix-cover-fanqie.mjs` | 封面强制 600×800 |
| `run-cover.mjs` | API 出封面 + fix |
| `run-doubao-tomato-structure.mjs` | 10 章节拍 / 字数审读（不出正文） |
| `audit-final.mjs` | 本地钩子审计 |
| ~~`run-step.mjs` / `run-all.mjs`~~ | **勿用**整章 API 扩写 |

---

## 6. 下次新书复用 checklist

- [ ] 定稿 md + 简介锁定
- [ ] 手工补情节（只插入，不重写）
- [ ] 豆包 polish：`1 2` → `3 4` → … → `9 10`
- [ ] format：`1 2 format` → …（**禁止章首【】**）
- [ ] `export-pack.mjs`
- [ ] 检查并删章首【】，同步 txt
- [ ] 封面 + `fix-cover-fanqie.mjs` 验 600×800
- [ ] 上传番茄：txt + 封面 + 简介

---

## 7. 版本记录

| 日期 | 说明 |
|------|------|
| 2026-07-03 | 全流程跑通；发布修改版（删章首【】、封面 600×800、约 1.1 万字正文） |

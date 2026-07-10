# InkOS 写章后 QA 流水线（待拍板）

> 状态：**草案 · 未启用**  
> 依赖：`.inkos/skills/story-deslop`、`story-review`（本地，不进 git）  
> 创建：2026-07-08

## 触发时机

| 场景 | 是否跑流水线 |
|------|----------------|
| `write next` / `revise chapter` 完成后 | ✅ 默认 |
| 手改正文后准备「定稿」 | ✅ |
| 仅改 `story/` 设定、未动正文 | ❌ |
| 大修 / 回炉重写 | ✅ full review |

## 流水线（三阶，均可在 Chat 用 `@skill`）

```
① write / revise（InkOS 主路径）
        ↓
② @story-deslop 只检测，不要改  ← 脚本 + Gate 扫描，出报告
        ↓
③ @story-review lean            ← solo 四视角 + 平台 rubric + LOCK 对照
        ↓
④ 按 severity 处置：
   · S1/S2 + blocking 脚本项 → revise_chapter 或手改
   · 仅 prose/AI 味 S2/S3   → @story-deslop 执行改写（非只检测）
   · S4                      → 排期或忽略
        ↓
⑤ （可选）再跑 ② 只检测，确认归零
```

## 命令速查

```text
@story-deslop 只检测，不要改 books/{书名}/chapters/NNNN_章名.md
@story-deslop 改 books/{书名}/chapters/NNNN_章名.md   ← 直接在原文上改，IDE diff 确认后自行保存
@story-review lean 审查第 N 章
```

CLI 预检（不等 Chat）：

```powershell
cd D:\蜜蜂族\工作台\writer\inkos
node .inkos/skills/story-deslop/scripts/check-ai-patterns.js --check "books/.../chapters/0001_*.md"
node .inkos/skills/story-deslop/scripts/check-degeneration.js --check "books/.../chapters/0001_*.md"
node .inkos/skills/story-deslop/scripts/normalize-punctuation.js --check "books/.../chapters/0001_*.md"
```

## 拍板项（请勾选后告知 Agent）

- [ ] **A.** 每章写完自动跑 ②③（人工在 Chat 触发，不 hook 自动化）
- [ ] **B.** 仅发章前 / 卷末跑 ②③
- [ ] **C.** blocking 脚本项（破折号/省略号/退化）必须清零才进下一章
- [ ] **D.** LOCK 章（book_rules 标注）review 必查数值，deslop 禁止改面板数字
- [ ] **E.** 流水线写入 `.cursor/rules` 常驻提醒（可选）

## 与 InkOS 内置 auditor 的关系

- **auditor**：写章循环内嵌，偏 continuity / governance  
- **story-review**：写章后外挂，偏网文平台 rubric + AI 味脚本  
- **story-deslop**：prose 专精，不改剧情  

三者互补，不替代 `write next` 内置审计。

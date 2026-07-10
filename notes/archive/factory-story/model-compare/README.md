# 工厂文 · 四模型重写对比

**输入**：`notes/archive/factory-story/versions/temp-revised-story-v2.md`（问题诊断 + 冲突骨架 + v2 全文）  
**任务**：按番茄女频口味全文重写，修正「男频横推 / 情绪核空 / 反派失能」三类问题  
**日期**：2026-07-03  

---

## 输出文件

| 模型 ID | 文件 | 字数约 | 耗时 | 状态 |
|---------|------|--------|------|------|
| `glm-5-2-260617` | [glm-5-2.md](glm-5-2.md) | 9687 | 94s | ✅ |
| `doubao-seed-2-1-turbo-260628` | [doubao-seed-2-1-turbo.md](doubao-seed-2-1-turbo.md) | 9477 | 169s | ✅ |
| `doubao-seed-evolving` | [doubao-seed-evolving.md](doubao-seed-evolving.md) | — | — | ⚠️ 见下 |
| `doubao-seed-character-260628` | [doubao-seed-character.md](doubao-seed-character.md) | 8618 | 49s | ✅ |

元数据：[meta.json](meta.json)  
重跑脚本：`node notes/archive/factory-story/model-compare/run-rewrite.mjs`

---

## 快速对比（读开篇 + 陆铮线 + 高潮即可）

### 1. GLM-5.2 — **改动最大，最贴诊断**

- ✅ 开篇**不揭穿**，「账以后再算」+ 提前布局论坛直播  
- ✅ 陆铮发现摄像头/急停线，**愧疚线**（签约前察觉苏晚在布局）  
- ✅ 签约后加了「对不起 / 以后不用一个人扛」  
- 段落偏短，节奏清楚；略增「布局爽」  
- **建议**：若你要「女频隐忍+亲手挖坑」，优先读这篇  

### 2. Doubao-Seed-2.1-turbo — **情绪最足，细节最狠**

- ✅ 开篇加「五毛包子、1800 生日红包」等**具体委屈**  
- ✅ 王厂长当面泼「偷方案」脏水；周皓演示时**反咬苏晚动手脚**  
- ✅ 结尾烤串、修理厂远景周皓，**烟火+对照**拉满  
- ⚠️ 略长，thinking tokens 多，耗时最长  
- **建议**：要番茄「够虐够具体、读者共情强」看这篇  

### 3. Doubao-Seed-Character — **最接近 v2，改动最小**

- 结构与 `temp-revised-story-v2.md` 几乎一致，仅微调措辞  
- 速度快、成本低  
- ⚠️ 对诊断三条**改善有限**（陆铮线、布局感仍弱）  
- **建议**：当 baseline；若 v2 已接近定稿，Character 适合轻润色而非大改  

### 4. Doubao-Seed-Evolving — **网络超时**

首次 batch 报 `fetch failed`；可单独重试：

```powershell
node notes/archive/factory-story/model-compare/run-rewrite.mjs
# 或只改 models 数组留 evolving 一项
```

---

## 你怎么选（建议）

1. **先读 GLM vs Turbo 开篇各 500 字** — 看要「隐忍布局」还是「细节扎心」  
2. **跳到签约社死段** — 看周皓是否够「会反咬」、苏晚是否够「亲手埋坑」  
3. **看陆铮怀疑→愧疚** — GLM 明显强于 Character  
4. 选定一版后说「这章不错」→ 我会按 KB 规则记 **场景+提示词**  

---

## 与原版对照

| 版本 | 路径 |
|------|------|
| 无流量旧版 | `notes/temp-original-story.txt` |
| 人工诊断 + v2 | `notes/archive/factory-story/versions/temp-revised-story-v2.md` |
| 模型输出 | 本目录四个 `.md` |

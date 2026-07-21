# 当前聚焦

## InkOS 必遵（写 ch16+ 时优先于旧 volume_map / vol1_chapters）

1. **章纲权威**：`outline/vol1_ch16-25_revised.md`（方案甲 · ch25 结卷1）
2. **写下一章**：只执行该文件对应章 + 对应 `runtime/ch*-rewrite-brief.md`（有则优先）
3. **红标**：ch21 partial；ch22 定情已结；ch23–25 **勿**复读拆包/定情主戏
4. **禁止照抄**：`vol1_chapters.md` 旧节拍；陈桂英追营 **ch23–24 已定稿结案** → ch25 结卷1
5. **开写**：`write` 带 `--context` 会重跑 plan 覆盖 intent；写前核对 intent Goal
6. **文风**：对话+动作推进；事实>描写；少修饰（`style_guide.md` 用户钉）；禁用「伟岸」

## 近期进度

| 批次 | 状态 | 说明 |
|------|------|------|
| **A–F** | ✅ | ch1–15 定稿 |
| **G ch16–25 大纲** | ✅ | `vol1_ch16-25_revised.md` |
| **H InkOS 可执行垫片** | ✅ | brief + focus 必遵 + volume_map 指针 |

| 章 | 标题 | 状态 |
|----|------|------|
| 1–15 | （略） | approved |
| 16 | 孙嫂子讨了个没趣 | approved |
| 17 | 后院种菜 | approved |
| 18 | 票齐了，拿好 | approved |
| 19 | 油渣挂面香 | approved |
| 20 | 说好延期，他怎么连夜赶回来了 | approved |
| 21 | 你说过，等回来亲手拆 | approved |
| 22 | 腕间的温度 | approved |
| 23 | 送柴人的口信 | approved |
| 24 | 这检讨书，你得按个手印 | approved |
| 25 | — | 待写：结卷1（营长公开口径 + 王德福撤职消息） |

## 下一步

1. 先备 `runtime/ch25-rewrite-brief.md` + HAND_LOCK `runtime/chapter-0025.intent.md`（你确认后再开写）
2. 硬事实锚（承接 ch24）：检讨书盖章在手；陈被带走教育留档（不坐牢）；赵干事/保卫科；180 县里已划清；中年男人身份未揭（H012）
3. ch25 主戏：① 霍营长身份公开口径 ② 王德福撤职/停职消息传到；章末可抛供销社/卷2轻钩，勿新开大战

## 写作约束（ch25）

- 对话+动作推进；事实>描写；少修饰；禁用「伟岸」
- **Style Emphasis 必带两行**：对话+动作 · 去AI味戒律（见 `style_guide.md` / brief）
- 女主 POV 禁反复报「西排二号」指自家
- 默认入口：`scripts/inkos-apifast-gemini.mjs`（gemini-2.5-pro）
- HAND_LOCK 写次：**勿**带 `--context-file`

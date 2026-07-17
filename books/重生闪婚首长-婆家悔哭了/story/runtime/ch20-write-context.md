# ch20 写作指引（霍归来 · 甲+乙 · 夜里急归 · HAND_LOCK）

## 重要（防二次 plan 覆盖）

`write next` **若带** `--context` / `--context-file`，InkOS 会**重跑 plan 并覆盖**手锁 intent。  
重写正文时请用下面「推荐命令」：**不要带 context-file**，让系统复用已锁的 `chapter-0020.intent.md`。

写前自检：打开 intent，Goal 必须是「进门当面重逢」，若又变成「归期落空/落册」→ 先恢复手锁再写。

## InkOS 必带 context（仅 plan 时用；write 时不要带）

```text
权威=story/outline/vol1_ch16-25_revised.md 的 ch20；brief=story/runtime/ch20-rewrite-brief.md。硬结果=夜里进门当面重逢；甲假延期+乙耳闻侧证；禁只侧证不见面；禁家属落册主戏；禁红标包裹；禁猪油油渣；禁脏信；禁陈到营。字数2400-2800。
```

## 推荐命令（apifast · gemini-2.5-pro）

```bash
# 仅当 intent 被覆盖时才重新 plan（plan 后必须再手锁/核对 intent）
# node scripts/inkos-apifast-gemini.mjs plan chapter 重生闪婚首长-婆家悔哭了 --context-file "books/重生闪婚首长-婆家悔哭了/story/runtime/ch20-rewrite-brief.md"

# 重写正文：不要带 --context-file / --context，复用手锁 intent
node scripts/inkos-apifast-gemini.mjs write next 重生闪婚首长-婆家悔哭了 --words 2600
```

> 临时换 gpt：把 `inkos-apifast-gemini.mjs` 换成 `inkos-tongapi.mjs`（可设 `INKOS_TONGAPI_MODEL`）。

## 自检

- [ ] intent Goal = 进门当面重逢（非「不见面+落册」）
- [ ] 有假延期 → 夜里急归**进门**见面
- [ ] 半公开为耳闻侧证
- [ ] 实利一句 + 感情近半步；任务收束
- [ ] 无红标/包裹；无猪油油渣；无家属落册主戏；无孙门岗大战；无看苗专场
- [ ] 极短段 + 中文双引号

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GLM-5.2 polish helper for 濒死拳台 v003."""

import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "drafts" / "v002"
OUT = ROOT / "drafts" / "v003"
CH_OUT = OUT / "chapters"

SYSTEM = """你是番茄小说男频短篇润色编辑。
硬性要求：
1. 不改剧情走向、人物关系、关键信息、回合数、时间线；不增删情节节点。
2. 文风：第一人称、节奏快、短句利落、痛感与悬念强；口语化但不低俗；适合番茄男频读者。
3. 避免堆砌形容词和"字字诛心""滔天"等网文烂梗；不要写成女频虐恋腔。
4. 保留并强化章末钩子；对话要狠、要短。
5. 只输出润色后的正文，不要标题行、不要解释、不要markdown代码块。"""


def load_key() -> str:
    key = os.environ.get("VOLCENGINE_ARK_API_KEY")
    if key:
        return key.strip()
    key_path = Path.home() / ".config" / "volcengine" / "ark-api-key"
    return key_path.read_text(encoding="utf-8").strip()


def chat(user: str, temperature: float = 0.62, max_tokens: int = 4096) -> str:
    body = {
        "model": "glm-5-2-260617",
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    req = urllib.request.Request(
        "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {load_key()}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()


def read_chapter(num: int) -> tuple[str, str]:
    path = SRC / "chapters" / f"{num:04d}.md"
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^#\s*第\d+章\s*(.+?)\s*\n", text)
    title = m.group(1).strip() if m else ""
    body = re.sub(r"^#\s*第\d+章.*\n", "", text, count=1).strip()
    return title, body


def read_hook() -> str:
    full = (SRC / "full.md").read_text(encoding="utf-8")
    part = full.split("## 开篇钩子", 1)[1].split("## 第1章", 1)[0].strip()
    return part


def polish_title_hook():
    hook = read_hook()
    user = f"""[purpose=番茄男频短篇书名+开篇钩子润色][round=1/4]
原书名：濒死拳台
故事梗概：地下黑拳手张磊被打到濒死，追查五年前失踪的姐姐张琳，录音笔缝在旧拳套里，牵出黑拳场老板李麻子与杀手阿鬼的大案。

请输出两段，用===分隔：
===TITLE===
给出一个更番茄男频短篇风格的书名（15-25字，可用冒号，突出悬念/逆袭/证据/姐姐）
===OPENING_HOOK===
润色开篇钩子（80-120字，不改剧情信息）

原文开篇钩子：
{hook}"""
    out = chat(user, temperature=0.7)
    (OUT / "title-hook.txt").write_text(out, encoding="utf-8")
    print("title-hook done")


def polish_chapter(num: int, extra: str = ""):
    title, body = read_chapter(num)
    user = f"""[purpose=润色濒死拳台第{num}章][round=1/4]
章名：{title}
{extra}
润色以下正文，字数与原文接近（±15%），不改剧情：

{body}"""
    result = chat(user)
    CH_OUT.mkdir(parents=True, exist_ok=True)
    (CH_OUT / f"{num:04d}.md").write_text(
        f"# 第{num}章 {title}\n\n{result}\n", encoding="utf-8"
    )
    print(f"chapter {num} done ({len(result)} chars)")


def main():
    batch = sys.argv[1] if len(sys.argv) > 1 else "1-3"
    if batch == "1-3":
        polish_title_hook()
        time.sleep(1)
        polish_chapter(1)
        time.sleep(1)
        polish_chapter(2, "注意与第1章衔接。")
        time.sleep(1)
        polish_chapter(3, "注意回合数逻辑：本章是第三回合读秒后休息+第四回合。")
    elif batch == "4-6":
        polish_chapter(4, "注意：本章是第五回合，与前章第四回合衔接。")
        time.sleep(1)
        polish_chapter(5, "濒死幻境揭示录音笔藏在旧拳套内衬，心脏停跳后复苏。")
        time.sleep(1)
        polish_chapter(6, "心脏复苏后第六回合，张磊改打法头锤反击。")
    elif batch == "7-9":
        polish_chapter(7, "裸绞逼供，李麻子是中间人。")
        time.sleep(1)
        polish_chapter(8, "胖子纵火断电，张磊从拳套内衬取出录音笔。")
        time.sleep(1)
        polish_chapter(9, "警察突入，阿鬼抢录音笔失败被擒。")
    elif batch == "10-12":
        polish_chapter(10, "救护车上李麻子坦白，录音笔已交警方证物袋。")
        time.sleep(1)
        polish_chapter(11, "赵警官播放录音，姐姐遗言。")
        time.sleep(1)
        polish_chapter(12, "出院结案，修旧拳套作念，全书完。")
    else:
        raise SystemExit(f"unknown batch: {batch}")


def merge_editor():
    """InkOS 内部编辑用：带 # / ## 标题的 markdown。"""
    hook = (OUT / "opening-hook.md").read_text(encoding="utf-8").strip()
    title = "黑拳濒死：我姐藏的录音笔牵出大案"
    parts = [f"# {title}", "", "## 开篇钩子", "", hook, ""]
    chapters = []
    for p in sorted(CH_OUT.glob("*.md")):
        text = p.read_text(encoding="utf-8")
        m = re.match(r"^#\s*(第\d+章\s*.+?)\s*\n", text)
        heading = m.group(1) if m else p.stem
        body = re.sub(r"^#\s*第\d+章.*\n", "", text, count=1).strip()
        parts += [f"## {heading}", "", body, ""]
        num = int(p.stem)
        ch_title = re.sub(r"^第\d+章\s*", "", heading)
        chapters.append(
            {"number": num, "title": ch_title, "content": body, "charCount": len(body)}
        )
    full = "\n".join(parts).rstrip() + "\n"
    OUT.joinpath("full.md").write_text(full, encoding="utf-8")
    OUT.joinpath(f"{title}.md").write_text(full, encoding="utf-8")
    draft = {
        "storyTitle": title,
        "openingHook": hook,
        "chapters": chapters,
        "source": "v002",
        "model": "glm-5-2-260617",
    }
    (OUT / "draft.json").write_text(
        json.dumps(draft, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return full


_CN_NUM = "零一二三四五六七八九十"


def chapter_label(num: int) -> str:
    if num <= 10:
        return f"第{_CN_NUM[num]}章"
    if num == 11:
        return "第十一章"
    if num == 12:
        return "第十二章"
    return f"第{num}章"


def merge_platform():
    """番茄作家平台粘贴用：无 markdown，章节 1. 2. 编号。"""
    hook = (OUT / "opening-hook.md").read_text(encoding="utf-8").strip()
    title = "黑拳濒死：我姐藏的录音笔牵出大案"
    parts = [hook, ""]
    for p in sorted(CH_OUT.glob("*.md")):
        text = p.read_text(encoding="utf-8")
        m = re.match(r"^#\s*第(\d+)章\s*(.+?)\s*\n", text)
        num = int(m.group(1)) if m else int(p.stem)
        ch_title = m.group(2).strip() if m else ""
        body = re.sub(r"^#\s*第\d+章.*\n", "", text, count=1).strip()
        parts += [f"{chapter_label(num)} {ch_title}", "", body, ""]
    content = "\n".join(parts).rstrip() + "\n"
    out = OUT / f"{title}-作家平台.txt"
    out.write_text(content, encoding="utf-8")
    return out


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "merge":
        merge_editor()
        path = merge_platform()
        print(f"editor + platform merged -> {path}")
    else:
        main()

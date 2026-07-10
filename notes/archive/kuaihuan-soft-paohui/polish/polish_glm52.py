#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GLM-5.2 polish Ch5-8 for 快穿-软妹炮灰把疯批男主钓疯了."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BOOK = Path(__file__).resolve().parents[1]
CH_DIR = BOOK / "chapters"
OUT_DIR = BOOK / "polish" / "out"
PRE_DIR = BOOK / "polish" / "pre"
INDEX = CH_DIR / "index.json"
MODEL = "glm-5-2-260617"

SYSTEM = """你是番茄/七猫女频快穿润色编辑。
只输出润色后的章节正文（含 # 标题行），不要解释、不要代码块。
第三人称；短句短段、一句一动、段间空行；口语化对话；保留【叮！】系统弹窗原文数字。
不改剧情走向、人物关系、好感度数、关键事件顺序；不增删情节节点。"""

HINTS: dict[int, str] = {
    5: "番茄女频快穿：早餐撒娇哭求保护+威胁短信+粉钻定位表，强化软妹钓疯批与反派作死对比，扩到约3000字。",
    6: "番茄女频快穿：车上喂糖解锁记忆碎片+侧门入校，甜宠与悬念并重，扩到约2800字，好感75和碎片画面保留。",
    7: "番茄女频快穿：后台候场压 tension，傅景深暗线与大屏证据铺垫，章末林薇薇站起留钩，扩到约2800字。",
    8: "番茄女频快穿：开学典礼打脸全收，好感80+翡翠坠新任务+顾明山出场，爽感拉满，扩到约3000字。",
}


def load_key() -> str:
    key = os.environ.get("VOLCENGINE_ARK_API_KEY")
    if key:
        return key.strip()
    key_path = Path.home() / ".config" / "volcengine" / "ark-api-key"
    return key_path.read_text(encoding="utf-8").strip()


def chat(user: str, temperature: float = 0.68, max_tokens: int = 8192) -> str:
    body = {
        "model": MODEL,
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
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()


def zh_char_count(text: str) -> int:
    body = re.sub(r"^#\s*第\d+章.*\n", "", text, count=1)
    return len(re.sub(r"\s", "", body))


def read_chapter(num: int) -> tuple[str, str, Path]:
    paths = sorted(CH_DIR.glob(f"{num:04d}_*.md"))
    if not paths:
        raise FileNotFoundError(f"chapter {num} not found")
    path = paths[0]
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^#\s*第\d+章\s*(.+?)\s*\n", text)
    title = m.group(1).strip() if m else ""
    body = re.sub(r"^#\s*第\d+章.*\n", "", text, count=1).strip()
    return title, body, path


def clean_output(raw: str, num: int, title: str) -> str:
    text = raw.strip()
    text = re.sub(r"^```(?:markdown|md)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    if not text.startswith("#"):
        text = f"# 第{num}章 {title}\n\n{text}"
    return text.rstrip() + "\n"


def build_prompt(num: int, title: str, body: str) -> str:
    hint = HINTS[num]
    return f"""# 第{num}章 {title}

{body}

提示：{hint}"""


def polish_chapter(num: int) -> Path:
    title, body, src_path = read_chapter(num)
    PRE_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    backup = PRE_DIR / src_path.name
    if not backup.exists():
        backup.write_text(src_path.read_text(encoding="utf-8"), encoding="utf-8")

    prompt = build_prompt(num, title, body)
    (OUT_DIR / f"prompt-{num:04d}.txt").write_text(prompt, encoding="utf-8")

    print(f"[ch{num}] calling {MODEL} ...")
    t0 = time.time()
    raw = chat(prompt)
    elapsed = time.time() - t0
    print(f"[ch{num}] done in {elapsed:.1f}s, {len(raw)} chars raw")

    polished = clean_output(raw, num, title)
    out_path = OUT_DIR / src_path.name
    meta = {
        "chapter": num,
        "title": title,
        "model": MODEL,
        "elapsedSec": round(elapsed, 1),
        "rawChars": len(raw),
        "zhChars": zh_char_count(polished),
        "at": datetime.now(timezone.utc).isoformat(),
    }
    out_path.write_text(polished, encoding="utf-8")
    (OUT_DIR / f"meta-{num:04d}.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    src_path.write_text(polished, encoding="utf-8")
    update_index(num, title, zh_char_count(polished))
    print(f"[ch{num}] wrote {src_path.name} ({meta['zhChars']} zh chars)")
    return src_path


def update_index(num: int, title: str, word_count: int) -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    for entry in index:
        if entry.get("number") == num:
            entry["title"] = title
            entry["wordCount"] = word_count
            entry["updatedAt"] = now
            if num >= 6:
                entry["status"] = "ready-for-review"
            break
    else:
        index.append(
            {
                "number": num,
                "title": title,
                "status": "ready-for-review",
                "wordCount": word_count,
                "createdAt": now,
                "updatedAt": now,
                "auditIssues": [],
                "lengthWarnings": [],
            }
        )
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: polish_glm52.py <5|6|7|8|all>")
    arg = sys.argv[1]
    if arg == "all":
        nums = [5, 6, 7, 8]
    else:
        nums = [int(arg)]
    for num in nums:
        if num not in HINTS:
            raise SystemExit(f"unsupported chapter: {num}")
        try:
            polish_chapter(num)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            raise SystemExit(f"API error {e.code}: {body}") from e
        if num != nums[-1]:
            time.sleep(2)


if __name__ == "__main__":
    main()

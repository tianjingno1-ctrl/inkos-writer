#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix Ch6-8 punctuation and unnatural line breaks to match Ch1-5."""

from __future__ import annotations

import re
from pathlib import Path

BOOK = Path(__file__).resolve().parents[1]
CH_DIR = BOOK / "chapters"
NUMS = (6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36)

SMART = str.maketrans({
    "\u201c": '"',
    "\u201d": '"',
    "\u2018": "'",
    "\u2019": "'",
    "\u2026": "……",
})


def parse_chapter(text: str) -> tuple[str, list[str]]:
    m = re.match(r"^(#\s*第\d+章[^\n]*)\n([\s\S]*)", text.strip() + "\n")
    title = m.group(1)
    body = m.group(2).strip()
    beats = [b.strip() for b in re.split(r"\n\s*\n", body) if b.strip()]
    return title, beats


def should_merge(prev: str, nxt: str) -> bool:
    if nxt in ("…", "……"):
        return True
    if prev.endswith("…") and nxt and nxt[0] not in '"【':
        return True
    if nxt.startswith(("【", '"', "「")):
        return False
    if nxt.startswith("——") and len(nxt) <= 20:
        return False  # keep short em-dash beats separate; we'll rewrite some
    if prev.endswith("——") and not prev.endswith("——"):
        pass
    # trailing comma/semicolon = unfinished beat
    if prev.endswith(("，", "；", "、", "时，", "的，", "了，", "呢，", "呀，", "啊，")):
        return True
    if prev.endswith("——") and nxt and nxt[0] not in '"':
        # narrative continues after em dash (e.g. 操场——讲...)
        return True
    # split dialogue tag from quote incorrectly
    if prev.endswith(("：", "道", "说", "问", "吩咐", "嘟囔", "应", "吼")) and nxt.startswith('"'):
        return True
    if prev.endswith('"') and nxt.startswith('"'):
        return False
    return False


def merge_beats(beats: list[str]) -> list[str]:
    out: list[str] = []
    i = 0
    while i < len(beats):
        cur = beats[i]
        while i + 1 < len(beats) and should_merge(cur, beats[i + 1]):
            nxt = beats[i + 1]
            if nxt in ("…", "……"):
                cur = cur.rstrip("…") + "……"
            else:
                cur = cur + nxt
            i += 1
        out.append(cur)
        i += 1
    return out


def polish_beat(s: str) -> str:
    s = s.translate(SMART)
    s = re.sub(r"……+", "……", s)
    s = s.replace("...", "……")
    # standalone em-dash beat → plain (Ch5 style)
    if re.fullmatch(r"——.+", s) and len(s) < 24:
        s = s.lstrip("——")
    # 累计积分 in system → 累计躺赢积分 (Ch5 template)
    s = s.replace("累计积分800", "累计躺赢积分800")
    s = s.replace("累计积分1800", "累计躺赢积分1800")
    return s


def format_chapter(title: str, beats: list[str]) -> str:
    beats = [polish_beat(b) for b in merge_beats(beats)]
    return title + "\n\n" + "\n\n".join(beats) + "\n"


def main() -> None:
    for num in NUMS:
        path = sorted(CH_DIR.glob(f"{num:04d}_*.md"))[0]
        title, beats = parse_chapter(path.read_text(encoding="utf-8"))
        new = format_chapter(title, beats)
        path.write_text(new, encoding="utf-8")
        print(f"ch{num}: {len(beats)} -> {len([b for b in new.split(chr(10)+chr(10)) if b.strip() and not b.startswith('#')])} beats")


if __name__ == "__main__":
    main()

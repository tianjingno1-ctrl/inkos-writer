#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reformat to Ch1-5 style: one beat per line, blank line between."""

from __future__ import annotations

import json
import re
from pathlib import Path

BOOK = Path(__file__).resolve().parents[1]
CH_DIR = BOOK / "chapters"
INDEX = CH_DIR / "index.json"
NUMS = (6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36)

OPENERS = frozenset("「『“\"")
CLOSERS = frozenset("」』”\"")


def zh_chars(s: str) -> int:
    return len(re.sub(r"\s", "", s))


def in_dialogue(depth: int) -> bool:
    return depth > 0


def split_sentences(line: str) -> list[str]:
    line = line.strip()
    if not line:
        return []
    if line.startswith("【"):
        return [line]

    parts: list[str] = []
    buf = ""
    depth = 0
    for ch in line:
        buf += ch
        if ch in OPENERS:
            depth += 1
        elif ch in CLOSERS:
            depth = max(0, depth - 1)
        if not in_dialogue(depth) and ch in "。！？…":
            seg = buf.strip()
            if seg:
                parts.append(seg)
            buf = ""
    tail = buf.strip()
    if tail:
        parts.append(tail)

    # Only split long narration (not pure dialogue lines) on commas
    out: list[str] = []
    for seg in parts:
        if seg.startswith(("“", '"')) and seg.endswith(("”", '"')):
            out.append(seg)
            continue
        if len(seg) <= 58:
            out.append(seg)
            continue
        sub: list[str] = []
        buf = ""
        depth = 0
        for ch in seg:
            buf += ch
            if ch in OPENERS:
                depth += 1
            elif ch in CLOSERS:
                depth = max(0, depth - 1)
            if not in_dialogue(depth) and ch in "，；" and len(buf.strip()) >= 22:
                s = buf.strip()
                if s:
                    sub.append(s)
                buf = ""
        if buf.strip():
            sub.append(buf.strip())
        out.extend(sub if len(sub) > 1 else [seg])
    return out


def merge_orphan_quotes(beats: list[str]) -> list[str]:
    merged: list[str] = []
    i = 0
    while i < len(beats):
        b = beats[i]
        if b in ('"', '"', '"') and merged:
            merged[-1] += b
            i += 1
            continue
        if i + 1 < len(beats) and beats[i + 1] in ('"', '"', '"'):
            merged.append(b + beats[i + 1])
            i += 2
            continue
        merged.append(b)
        i += 1
    return merged


def format_body(body: str) -> list[str]:
    body = body.replace("\r\n", "\n")
    body = re.sub(r"\n---\n", "\n", body)
    beats: list[str] = []
    for raw in body.split("\n"):
        raw = raw.strip()
        if not raw:
            continue
        beats.extend(split_sentences(raw))
    return merge_orphan_quotes(beats)


def format_chapter(text: str) -> str:
    m = re.match(r"^(#\s*第\d+章[^\n]*)\n([\s\S]*)", text.strip() + "\n")
    if not m:
        raise ValueError("bad chapter header")
    beats = format_body(m.group(2))
    return m.group(1) + "\n\n" + "\n\n".join(beats) + "\n"


def main() -> None:
    # Re-read from out-doubao backup (paragraph version) if we need re-run;
    # here we re-process current files with fixed logic.
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    for num in NUMS:
        path = sorted(CH_DIR.glob(f"{num:04d}_*.md"))[0]
        # Use doubao raw from out-doubao: strip title, reformat from single-line paragraphs
        out_doubao = BOOK / "polish" / "out-doubao" / path.name
        if out_doubao.exists():
            raw = out_doubao.read_text(encoding="utf-8")
        else:
            raw = path.read_text(encoding="utf-8")
        new = format_chapter(raw)
        path.write_text(new, encoding="utf-8")
        wc = zh_chars(re.sub(r"^#\s*第\d+章.*\n", "", new, count=1))
        for row in index:
            if row.get("number") == num:
                row["wordCount"] = wc
                break
        lines = [ln for ln in new.split("\n") if ln.strip()]
        print(f"ch{num}: {len(lines)} beats, {wc} chars")
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

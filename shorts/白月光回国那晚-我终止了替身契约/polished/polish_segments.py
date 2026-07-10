#!/usr/bin/env python3
"""Split full.md into 5 segments and polish via Volcengine Ark (Doubao)."""
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
FULL_MD = BASE / "final" / "full.md"
OUT_DIR = Path(__file__).resolve().parent
SEG_DIR = OUT_DIR / "segments"

INSTRUCTIONS = {
    1: (
        "请润色以下正文，保持原有剧情走向、人物关系与关键情节节点不变。\n\n"
        "文风：番茄女频追妻火葬场短篇——女主清醒止损、体面离开；男主嘴硬后察觉空落，悔意从细节（薄荷糖、空沙发、空抽屉）慢慢渗出来；"
        "情绪刀糖并重，节奏紧凑，对话口语有张力；第三人称叙述。\n\n"
        "直接输出润色后的正文，可直接替换原文。"
    ),
    2: (
        "请润色以下正文，保持原有剧情走向、人物关系与关键情节节点不变。\n\n"
        "文风：番茄女频追妻火葬场——男主通过便签、饭盒、速写本层层剥开迟来的悔意；女主剪短发开工作室，独立清醒、不卑不亢；"
        "白月光对峙要爽、要利；细节杀（薄荷糖便签、速写本、隐藏相册）写足；第三人称，节奏紧凑。\n\n"
        "直接输出润色后的正文，可直接替换原文。"
    ),
    3: (
        "请润色以下正文，保持原有剧情走向、人物关系与关键情节节点不变。\n\n"
        "文风：番茄女频追妻火葬场——网暴虐女主、男主护妻受阻的憋屈感写足；白月光以利益要挟要够狠；"
        "男主暗中查资料、撕承诺信、匿名下单等行动线清晰；女主独立赶工、拒绝他帮忙的清醒人设稳住；第三人称，冲突密集。\n\n"
        "直接输出润色后的正文，可直接替换原文。"
    ),
    4: (
        "请润色以下正文，保持原有剧情走向、人物关系与关键情节节点不变。\n\n"
        "文风：番茄女频追妻火葬场高潮段——雨夜跪门、速写合集、免提电话打脸白月光，情绪层层推高；"
        "女主质问三年为什么不说要够痛；见家长对峙爽感拉满，女主答图他什么要清醒有骨；第三人称，对话驱动，段末留劲。\n\n"
        "直接输出润色后的正文，可直接替换原文。"
    ),
    5: (
        "请润色以下正文，保持原有剧情走向、人物关系与关键情节节点不变。\n\n"
        "文风：番茄女频追妻火葬场收束段——发布会公开认爱要够燃；补糖段（樱花采风、背她过河、还母债、墓前磕头、海边预支戒指）细腻暖；"
        "画展当众求婚加撕契约收尾，甜虐闭环；第三人称，情绪由虐转甜，结尾留余韵。\n\n"
        "直接输出润色后的正文，可直接替换原文。"
    ),
}

# Split by chapter headings (## 第N章 ...)
CHAPTER_RE = re.compile(r"^## 第\d+章", re.MULTILINE)


def load_key() -> str:
    key = os.environ.get("VOLCENGINE_ARK_API_KEY", "").strip()
    if not key:
        key_path = Path.home() / ".config" / "volcengine" / "ark-api-key"
        if key_path.exists():
            key = key_path.read_text(encoding="utf-8").strip()
    if not key:
        sys.exit("Missing VOLCENGINE_ARK_API_KEY")
    return key


def extract_body(text: str) -> str:
    """Strip markdown headers, keep paragraph text."""
    lines = []
    for line in text.splitlines():
        if line.startswith("#"):
            continue
        lines.append(line)
    body = "\n".join(lines).strip()
    return re.sub(r"\n{3,}", "\n\n", body)


def split_segments(full_text: str) -> dict[int, str]:
    hook_match = re.search(r"^## 开篇钩子\s*\n", full_text, re.MULTILINE)
    if not hook_match:
        raise ValueError("Cannot find 开篇钩子 section")

    ch1_match = re.search(r"^## 第1章", full_text, re.MULTILINE)
    ch2_match = re.search(r"^## 第2章", full_text, re.MULTILINE)
    ch4_match = re.search(r"^## 第4章", full_text, re.MULTILINE)
    ch6_match = re.search(r"^## 第6章", full_text, re.MULTILINE)
    ch9_match = re.search(r"^## 第9章", full_text, re.MULTILINE)

    return {
        1: full_text[hook_match.end() : ch2_match.start()],
        2: full_text[ch2_match.start() : ch4_match.start()],
        3: full_text[ch4_match.start() : ch6_match.start()],
        4: full_text[ch6_match.start() : ch9_match.start()],
        5: full_text[ch9_match.start() :],
    }


def call_doubao(key: str, user_content: str, temperature: float = 0.6) -> str:
    api = os.environ.get(
        "VOLCENGINE_ARK_API_BASE", "https://ark.cn-beijing.volces.com/api/v3"
    )
    model = os.environ.get(
        "VOLCENGINE_ARK_MODEL", "doubao-seed-2-0-lite-260215"
    )
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "你是中文网文写作助手。输出可直接用于正文，只输出润色后正文，不加解释或标题。",
            },
            {"role": "user", "content": user_content},
        ],
        "temperature": temperature,
        "max_tokens": 8192,
    }
    req = urllib.request.Request(
        f"{api}/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    content = data["choices"][0]["message"]["content"]
    return content.strip()


def main():
    SEG_DIR.mkdir(parents=True, exist_ok=True)
    key = load_key()
    full_text = FULL_MD.read_text(encoding="utf-8")
    segments = split_segments(full_text)

    results: dict[int, str] = {}
    for i in range(1, 6):
        raw = extract_body(segments[i])
        prompt = f"{INSTRUCTIONS[i]}\n\n---\n\n{raw}"
        (SEG_DIR / f"part{i:02d}-input.md").write_text(prompt, encoding="utf-8")
        print(f"[part{i}] calling Doubao ({len(raw)} chars)...", flush=True)
        for attempt in range(3):
            try:
                out = call_doubao(key, prompt)
                results[i] = out
                (OUT_DIR / f"part{i:02d}.md").write_text(out, encoding="utf-8")
                print(f"[part{i}] done ({len(out)} chars)", flush=True)
                break
            except Exception as e:
                print(f"[part{i}] attempt {attempt + 1} failed: {e}", flush=True)
                if attempt == 2:
                    raise
                time.sleep(5)

    merged_parts = ["# 白月光回国那晚，我终止了替身契约\n\n"]
    for i in range(1, 6):
        merged_parts.append(results[i])
        merged_parts.append("\n\n")
    (OUT_DIR / "full-polished.md").write_text("".join(merged_parts).strip() + "\n", encoding="utf-8")
    print("Saved full-polished.md", flush=True)


if __name__ == "__main__":
    main()

#!/usr/bin/env node
/**
 * 火花审计：上架包扩写 + 钩子
 * 用法: node run-huohua-audit.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "huohua-audit.md");

const TOKEN =
  process.env.HUOHUA_DATA_TOKEN ??
  readFileSync(join(homedir(), ".config/huohua/data-token"), "utf8").trim();

const API = process.env.HUOHUA_API_BASE ?? "https://api.huohuaapi.cn/v1";

const final = readFileSync(join(__dir, "..", "temp-revised-story-final.md"), "utf8");
const intro = final.match(/## 书籍简介[\s\S]*?(?=\n---\n\n## 备选)/)?.[0] ?? "";
const body = final.match(/## 正文\n([\s\S]*)/)?.[1] ?? "";
const han = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;

const storyBrief = `
【书名】《全网看我：螺丝女工干翻天才前男友》
【标签】女性生活、打脸逆袭、重生、爽文、职场
【简介】${intro.replace(/## 书籍简介[^\n]*\n/, "").trim().slice(0, 400)}
【正文字数】约 ${han(body)} 汉字（11段---分隔，无分章标题）
【核心设定】扭距错字=溯源烙印；23号工位；0.84丝专利；103/127N·m；老猫身份；全网直播炸场
【待审计】1) 章末/段末钩子是否够 2) 距8500字缺口如何扩 3) 哪些段优先加围观/弹幕节拍
【正文摘要】重生校门口打脸→车间99.7%→林雪柔公屏反转→0.84丝→办公室揭穿→签约炸场→追责→专利签约→烤串结局
`.trim();

async function search(purpose, filters, query, current, planned) {
  const payload = {
    source: "novel_creation",
    purpose,
    search_count: { planned, current },
    filters,
    query,
  };
  const r = await fetch(`${API}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 500)}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const purpose = "审计番茄女频重生打脸短篇的钩子与扩写节拍";

const calls = [
  {
    filters: { material_type: "作品画像", commercial_tags: ["打脸逆袭", "重生"] },
    query: `番茄女频短篇上架标准：开篇钩子、段末悬念、全文字数区间。${storyBrief}`,
  },
  {
    filters: { material_type: "桥段", commercial_tags: ["打脸逆袭"] },
    query: `重生职场打脸短篇：当众揭穿、围观效应、证据链逐条曝光、逆袭落袋，各阶段扩写节拍（不加空泛描写）。${storyBrief}`,
  },
  {
    filters: { material_type: "文风", audience_orientation: ["女频"] },
    query: `番茄爽文短篇：章末钩子写法、重生女主清醒人设、打脸节奏。请对照上文审计正文钩子强弱。${storyBrief}`,
  },
];

const sections = [];
sections.push(`# 火花审计 · 上架包扩写 + 钩子\n`);
sections.push(`> 母版：\`temp-revised-story-final.md\`\n`);
sections.push(`> 正文 ${han(body)} 字 · 简介 ${han(intro)} 字 · 目标 8500~9500\n`);
sections.push(`> 生成：${new Date().toISOString().slice(0, 19)}\n\n---\n`);

for (let i = 0; i < calls.length; i++) {
  const { filters, query } = calls[i];
  console.log(`火花检索 ${i + 1}/${calls.length}…`);
  const res = await search(purpose, filters, query, i + 1, calls.length);
  const md =
    typeof res === "string"
      ? res
      : res.markdown ?? res.content ?? JSON.stringify(res, null, 2);
  sections.push(`\n## 检索 ${i + 1} · ${filters.material_type}\n\n${md}\n\n---\n`);
}

writeFileSync(OUT, sections.join(""), "utf8");
console.log("OK", OUT);

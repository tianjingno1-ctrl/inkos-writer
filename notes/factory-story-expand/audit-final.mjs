#!/usr/bin/env node
/** 上架包 local 钩子 + 字数审计 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const final = readFileSync(join(__dir, "..", "temp-revised-story-final.md"), "utf8").replace(/\r\n/g, "\n");
const intro = final.match(/## 书籍简介[\s\S]*?(?=\n---\n\n## 备选)/)?.[0] ?? "";
const body = final.match(/## 正文\n([\s\S]*)/)?.[1] ?? "";
const han = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;
const parts = body.split(/\n---\n/).map((s) => s.trim()).filter(Boolean);

const hookCheck = [
  ["简介·溯源烙印", /错字是我故意留的溯源烙印/],
  ["简介·23号工位", /23号工位/],
  ["简介·大国精工", /大国精工/],
  ["正文·扭距错字", /扭距/],
  ["正文·0.84丝", /0\.84丝/],
  ["正文·103\/127N·m", /103N·m.*127N·m/s],
  ["正文·老猫", /老猫/],
  ["正文·三分糖奶茶", /三分糖/],
  ["正文·技术合伙人", /技术合伙人/],
  ["正文·终极户口本", /户口本/],
  ["可选·第十七页", /第十七页/],
  ["可选·粉身碎骨", /粉身碎骨/],
  ["可选·周皓威胁找工", /永远找不到一份工作/],
  ["可选·签约跪求复合", /跪求复合/],
  ["可选·炸场后回工位", /回23号工位.*继续/],
  ["可选·扳手哐当", /哐当/],
  ["可选·三分糖回忆", /买遍一百杯/],
];

const expandSteps = [
  { id: "E01", seg: 1, beat: "校门口反杀后", point: "围观学生搜论文确认错字（压制→反转→围观）", huohua: "当众打脸", expect: "+150~250" },
  { id: "E02", seg: 1, beat: "第1段末", point: "补周皓「永远找不到工作」+苏晚「粉身碎骨」章末钩（web稿有，final缺）", huohua: "段末悬念", expect: "+80~120" },
  { id: "E03", seg: 2, beat: "99.7%出炉前", point: "工友嘲笑→噤声→鼓掌短对话", huohua: "围观效应", expect: "+200~350" },
  { id: "E04", seg: 3, beat: "公屏三连击后", point: "工友/行政改口3~5句", huohua: "反转→围观", expect: "+200~300" },
  { id: "E05", seg: 3, beat: "林雪柔开场", point: "「等着签约那天跪求复合」威胁钩（web稿有）", huohua: "段末预告", expect: "+40~80" },
  { id: "E06", seg: 5, beat: "周皓写不出公式", point: "赵主任变脸+办公室众人反应", huohua: "后果", expect: "+150~250" },
  { id: "E07", seg: 7, beat: "签约大会", point: "董事席闲语+红毯媒体（烘托全行业围观）", huohua: "公开场合", expect: "+150~220" },
  { id: "E08", seg: 7, beat: "警报→急停", point: "应力逼近+屏息两秒（不加内心戏）", huohua: "千钧一发", expect: "+200~350" },
  { id: "E09", seg: 7, beat: "四张铁证", point: "逐条曝光+每条1~2弹幕/围观（**重点**）", huohua: "证据链", expect: "+400~550" },
  { id: "E10", seg: 7, beat: "撤销奖学金后", point: "董事撤合作意向短对话", huohua: "后果", expect: "+300~400" },
  { id: "E11", seg: 7, beat: "周皓拖走前", point: "苏晚回23号工位继续拧轴（web稿有）", huohua: "人设钩", expect: "+60~100" },
  { id: "E12", seg: 11, beat: "路过修理厂后", point: "扳手哐当+三分糖回不去回忆（web稿有）", huohua: "余韵钩", expect: "+120~180" },
];

let report = `# 上架包审计 · final.md + 火花

> 母版：**\`temp-revised-story-final.md\`**（简介 + 正文，不改 web 稿覆盖）
> 正文 **${han(body)}** 字 · 简介 **${han(intro)}** 字 · 目标 **8500~9500**

---

## 一、字数

| 项 | 值 |
|----|-----|
| 正文 | ${han(body)} |
| 缺口（按8500） | **${8500 - han(body)}** |
| 缺口（按9000） | **${9000 - han(body)}** |
| 扩写步预期合计 | 约 +2050~3150（12步，见下） |

---

## 二、11段结构

| 段 | 汉字 | 内容 |
|----|------|------|
${parts.map((p, i) => `| ${i + 1} | ${han(p)} | ${p.split("\n").find((l) => l.trim())?.slice(0, 28) ?? ""}… |`).join("\n")}

---

## 三、钩子清单（简介 + 正文）

### 已有 ✓

${hookCheck.filter(([, re]) => re.test(final)).map(([n]) => `- ✓ ${n}`).join("\n")}

### 正文可加强（web 稿有 / 简介已预告但正文未落地）

${hookCheck.filter(([, re]) => !re.test(final)).map(([n]) => `- ○ ${n}`).join("\n")}

---

## 四、火花审计要点（检索归纳）

1. **扩字靠桥段节拍**，不是加水描写：压制→触发→反转→围观→后果。
2. **当众打脸**要围观反馈（同事改口、弹幕、董事撤单），一段一个爽点。
3. **证据链**逐条曝光，每条后跟反应，不要一次堆完。
4. **段末留钩**：威胁、预告、余韵（粉身碎骨、跪求复合、扳手哐当）。
5. **文风**：口语化对话 + 短段落 + 快节奏（对标番茄女频爽文）。

完整火花 raw 见 \`huohua-audit.md\`。

---

## 五、扩写任务表（只插不改，基于 final 母版）

| ID | 段 | 插入点 | 修改点 | 预期 |
|----|----|--------|--------|------|
${expandSteps.map((s) => `| ${s.id} | ${s.seg} | ${s.beat} | ${s.point} | ${s.expect} |`).join("\n")}

**建议顺序**：E01→E02→E03→…→E12；每步只改一处，**禁止整段 API 重写**。

---

## 六、与 web-doubao / expand 的关系

| 文件 | 角色 |
|------|------|
| \`temp-revised-story-final.md\` | **唯一母版**（简介定稿 + 正文11段） |
| \`notes/archive/factory-story/versions/temp-revised-story-web-doubao.md\` | 正文加强**参考**（E02/E05/E11/E12 原文在此） |
| \`factory-story-expand/\` | 废弃实验，勿覆盖母版 |

`;

writeFileSync(join(__dir, "AUDIT-FINAL.md"), report, "utf8");
console.log(report);

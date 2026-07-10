import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const KEY = process.env.VOLCENGINE_ARK_API_KEY
  ?? readFileSync(join(homedir(), ".config/volcengine/ark-api-key"), "utf8").trim();
const API = "https://ark.cn-beijing.volces.com/api/v3";

const storyPath = join(__dir, "../versions/temp-revised-story-v3.md");
const story = readFileSync(storyPath, "utf8");
const body = story.replace(/^#.*?\n\n>[\s\S]*?\n\n---\n\n/, "");

// Evolving 推理慢：送「开篇+情节点+结尾」代替全文，够责编诊断
const opening = body.slice(0, 2200);
const ending = body.slice(-2800);
const beats = `
【情节骨架】
1. 校门口：周皓摔笔记、国奖论文抄「扭距」、苏晚隐忍「只算账」
2. 车间：王厂长被周皓唆使开除→苏晚半小时调合格率99.7%留任
3. 林雪柔公屏晒八万转账羞辱「舔狗」
4. 周皓抢0.84方案反咬偷机密→苏晚登录论坛「老猫」自证→陆铮给全权限工牌升技术主管
5. 陆铮妥协让周皓签约演示；苏晚装摄像头+急停+论坛直播埋伏
6. 签约：周皓127N·m差点炸机→公屏曝论文/监控/录音→陈院士弹幕→林雪柔扇巴掌撤资
7. 金句「你配不上我恨」；周皓修理厂对照；专利合同8%分成+银行短信+技术合伙人牌（逆袭落袋）
8. 尾声：烤串奶茶烟火气；周皓路边悔悟`;

const system =
  "你是番茄小说女频资深责编，擅长诊断「为什么读者划走」。直接输出结构化审阅报告，不要改写正文，不要输出思考过程。";
const user = `【上架标签】女性生活、打脸逆袭、重生（心态）、爽文、职场

【作者困惑】改了好几版，读者没有想继续读下去的欲望。请基于下面材料审阅，诊断吸引力不足的原因。

【请按此结构输出】
1. 黄金3秒/前500字：是否立住人设+冲突+钩子？读者会划走吗？为什么？
2. 中段节奏：哪里拖沓、哪里重复、哪里爽点间隔太长？
3. 情绪：虐是否够具体？爽是否来得太晚？止损感是否到位？
4. 人设：苏晚/周皓/陆铮谁不够活？有没有「工具人感」？
5. 番茄同类竞品差距：缺什么「让读者上头」的元素？
6. 具体改法：给5条可执行修改建议（含建议改写的开篇1-2句示例）
7. 总评：一句话 + 吸引力打分（1-10）

${beats}

【开篇约2200字】
${opening}

【结尾约2800字】
${ending}`;

const res = await fetch(`${API}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "doubao-seed-evolving",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.35,
    max_tokens: 5000,
  }),
  signal: AbortSignal.timeout(300000),
});

const text = await res.text();
if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 500)}`);

const json = JSON.parse(text);
const content = json.choices?.[0]?.message?.content ?? "";
const outPath = join(__dir, "review-evolving-v3.md");
writeFileSync(
  outPath,
  `# Doubao-Seed-Evolving 审阅 · v3 吸引力诊断\n\n> 模型：\`doubao-seed-evolving\` · 输入：temp-revised-story-v3.md\n\n---\n\n${content}\n\n---\n\n\`\`\`json\n${JSON.stringify({ usage: json.usage, finish_reason: json.choices?.[0]?.finish_reason }, null, 2)}\n\`\`\`\n`,
  "utf8",
);
console.log("OK", outPath, content.length, JSON.stringify(json.usage));

import { readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import http from 'http';
import https from 'https';

const KEY = (process.env.VOLCENGINE_ARK_API_KEY || readFileSync(join(homedir(), '.config/volcengine/ark-api-key'), 'utf8')).trim();
const API = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = 'doubao-seed-evolving';
const outFile = join(process.cwd(), 'notes/archive/factory-story/versions/temp-revised-story.md');
const storyFile = join(process.cwd(), 'notes/temp-original-story.txt');

const fullStory = readFileSync(storyFile, 'utf8');

const systemPrompt = `你是番茄小说女频短篇顶级编辑兼写手，专精「打脸逆袭+身份反转+工业/职场爽文」。
输出要求：
1. 先用不超过300字诊断原文「没人看、没人看到底」的核心问题（分点列出）
2. 然后输出一行「---修订正文---」
3. 再输出完整修订后正文，可直接发布，不要解释过程
4. 修订正文用短段落、强钩子开篇、快节奏、口语化对话，女频读者友好
5. 保留核心设定：苏晚=老猫、周皓抄袭、陆铮、陈院士、打螺丝逆袭；可大改情节顺序、删减重复打脸、加强情感与悬念
6. 全文8000-12000字，章末留情绪余韵，不要过度说教升华`;

const userPrompt = `请大改以下番茄女频短篇。用户反馈：发布上去没人看，不知道为啥，没有人看到底。

【番茄女频爽文要求】
- 开篇3秒抓人：第一句就要有冲突/羞辱/悬念，不要温吞铺垫
- 短句为主，一段不超过3行，适合手机碎片化阅读
- 每300-500字一个小爽点或钩子，让读者停不下来
- 女频要情绪：委屈→隐忍→爆发→打脸，要有让读者代入的「被看不起」感
- 技术细节能删则删，用结果说话，别堆参数和公式名
- 反派打一次脸打透，不要同一梗（如「扭距」错别字）反复用
- 男主感情线要有糖，别全程工具人
- 结尾爽完即收，别长篇大道理

【原文全文】

${fullStory}`;

const body = JSON.stringify({
  model: MODEL,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  temperature: 0.88,
  max_tokens: 32000,
});

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 900_000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 400) reject(new Error(`${res.statusCode}: ${text}`));
          else resolve(JSON.parse(text));
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Request timeout')));
    req.write(data);
    req.end();
  });
}

console.log(`Calling ${MODEL} (story: ${fullStory.length} chars)...`);
const data = await postJson(`${API}/chat/completions`, body);
const content = data.choices?.[0]?.message?.content ?? '';
writeFileSync(outFile, content, 'utf8');
console.log(`Saved to ${outFile} (${content.length} chars)`);
if (data.usage) {
  console.log(`Tokens: prompt=${data.usage.prompt_tokens} completion=${data.usage.completion_tokens}`);
}

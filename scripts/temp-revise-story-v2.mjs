import { readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import https from 'https';

const KEY = (process.env.VOLCENGINE_ARK_API_KEY || readFileSync(join(homedir(), '.config/volcengine/ark-api-key'), 'utf8')).trim();
const API = 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = 'doubao-seed-evolving';
const outFile = join(process.cwd(), 'notes/archive/factory-story/versions/temp-revised-story-v2.md');

const systemPrompt = `你是番茄女频短篇金牌编剧，擅长「止损女主+火葬场+马甲打脸」，不是男频工业爽文写手。

输出格式：
1. 先用400字以内说明：上一版为什么「味道不对」（从冲突类型、女频情绪核、反派反击三个维度）
2. 输出「---冲突骨架---」+ 8段式情节骨架（每段1-2句，标出虐点/爽点/钩子）
3. 输出「---修订正文---」+ 完整正文（9000-12000字）

写作铁律：
- 女频核：委屈要具体（钱、尊严、被当工具人），爽要落在「他后悔/她不再需要他」
- 冲突必须是双向的：反派要会反击、会设局、会让女主一度陷入被动
- 开篇女主不能第一句就赢，要先忍、先吃亏，30%处才第一次小反击
- 陆铮要有摩擦：先怀疑/试探/立场冲突，再偏爱，感情线占15%篇幅
- 林雪柔要会捅刀子（转账记录、造谣、抢功劳），不是只会嘴贱
- 高潮靠女主自己埋的局收尾，陈院士只能锦上添花，不能天降救场
- 技术细节全部服务于情绪，禁止堆参数
- 短段、口语、手机阅读友好`;

const userPrompt = `用户反馈：豆包上一版修订后「味道还是不对」，怀疑剧情冲突不够。

【上一版的问题（供你避免）】
- 开篇就怼赢前男友，虐感为零
- 周皓全程被动挨打，不会反击
- 陆铮从第一天就是开挂辅助，没有感情摩擦
- 打脸靠陈院士天降，女主主动性弱
- 整体像男频工业爽文套了女频皮，缺情感拉扯和修罗场

【必须保留的设定】
苏晚=论坛大神老猫；周皓抄袭她论文拿国奖；陆铮陆氏少东家；星河精密厂二十三号工位；林雪柔千金；陈院士可出场但非唯一翻盘手

【新冲突架构（必须按此写）】
1. 开篇：校门口被羞辱，苏晚忍下没揭穿（把「扭距」留作后手），读者替她憋屈
2. 进厂前/初进厂：周皓提前跟厂长打招呼要「盯着」她，制造开除危机
3. 第一次小爽：拧螺丝惊艳，但随即被林雪柔拿「三年转账记录」当众羞辱她是舔狗供养者
4. 中段虐：苏晚提0.84参数建议，被周皓反咬「泄密商业机密」，差点被赶出厂+陆铮一度怀疑她
5. 转折：苏晚用三年前论坛发帖时间戳+自己埋的备份证据自证，陆铮转而护她
6. 高潮修罗场：周皓来考察当众演示，苏晚早布好监测录像+直播，当众拆穿+设备险些炸（急停）
7. 周皓社死+林雪柔翻脸，但苏晚对周皓只说一句最狠的止损台词（不是骂街，是「我不恨你了，你配不上我恨」这类）
8. 结尾：烟火气收束，陆铮糖，螺丝礼物，不要大国叙事

请输出：诊断 + 冲突骨架 + 完整正文。`;

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

const body = JSON.stringify({
  model: MODEL,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  temperature: 0.9,
  max_tokens: 32000,
});

console.log(`Calling ${MODEL} for conflict-focused rewrite...`);
const data = await postJson(`${API}/chat/completions`, body);
const content = data.choices?.[0]?.message?.content ?? '';
writeFileSync(outFile, content, 'utf8');
console.log(`Saved to ${outFile} (${content.length} chars)`);
if (data.usage) {
  console.log(`Tokens: prompt=${data.usage.prompt_tokens} completion=${data.usage.completion_tokens}`);
}

# UTF-8 script to call doubao-seed-evolving for story revision
$ErrorActionPreference = 'Stop'

$KEY = if ($env:VOLCENGINE_ARK_API_KEY) { $env:VOLCENGINE_ARK_API_KEY.Trim() } else { (Get-Content "$env:USERPROFILE\.config\volcengine\ark-api-key" -Raw).Trim() }
$API = "https://ark.cn-beijing.volces.com/api/v3"
$MODEL = "doubao-seed-evolving"
$OutFile = "d:\蜜蜂族\工作台\writer\inkos\notes\temp-revised-story.md"
$StoryFile = "d:\蜜蜂族\工作台\writer\inkos\notes\temp-original-story.txt"

$fullStory = [System.IO.File]::ReadAllText($StoryFile, [System.Text.Encoding]::UTF8)

$systemPrompt = @'
你是番茄小说女频短篇顶级编辑兼写手，专精「打脸逆袭+身份反转+工业/职场爽文」。
输出要求：
1. 先用不超过300字诊断原文「没人看、没人看到底」的核心问题（分点列出）
2. 然后输出一行「---修订正文---」
3. 再输出完整修订后正文，可直接发布，不要解释过程
4. 修订正文用短段落、强钩子开篇、快节奏、口语化对话，女频读者友好
5. 保留核心设定：苏晚=老猫、周皓抄袭、陆铮、陈院士、打螺丝逆袭；可大改情节顺序、删减重复打脸、加强情感与悬念
6. 全文8000-12000字，章末留情绪余韵，不要过度说教升华
'@

$userPrompt = @"
请大改以下番茄女频短篇。用户反馈：发布上去没人看，不知道为啥，没有人看到底。

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

$fullStory
"@

$bodyObj = @{
    model = $MODEL
    messages = @(
        @{ role = "system"; content = $systemPrompt }
        @{ role = "user"; content = $userPrompt }
    )
    temperature = 0.88
    max_tokens = 32000
}

$jsonBody = $bodyObj | ConvertTo-Json -Depth 10 -Compress
$jsonFile = "d:\蜜蜂族\工作台\writer\inkos\notes\temp-api-body.json"
[System.IO.File]::WriteAllText($jsonFile, $jsonBody, [System.Text.UTF8Encoding]::new($false))

Write-Host "Calling $MODEL (story length: $($fullStory.Length) chars)..."
try {
    $response = Invoke-RestMethod -Uri "$API/chat/completions" -Method POST `
        -Headers @{ Authorization = "Bearer $KEY"; "Content-Type" = "application/json; charset=utf-8" } `
        -Body ([System.IO.File]::ReadAllBytes($jsonFile)) `
        -TimeoutSec 600

    $content = $response.choices[0].message.content
    [System.IO.File]::WriteAllText($OutFile, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Saved to $OutFile"
    if ($response.usage) {
        Write-Host "Tokens: prompt=$($response.usage.prompt_tokens) completion=$($response.usage.completion_tokens)"
    }
} catch {
    Write-Host "ERROR: $_"
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    exit 1
}

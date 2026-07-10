# doubao-seed-evolving · 调用失败

> 模型：`doubao-seed-evolving`  
> 错误：请求超时（120s+），`fetch failed` / `The operation was aborted due to timeout`  
> 时间：2026-07-03  

可能原因：Evolving 模型响应慢或需更长 timeout / 更小任务分段。

**重试**：编辑 `run-rewrite.mjs` 只保留 evolving 一项，或改用控制台 `ep-` 接入点；也可改为「只重写开篇+签约两节」降长度。

其他三模型输出见同目录 README.md。

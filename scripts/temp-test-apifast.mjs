import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
let key = process.env.INKOS_APIFAST_KEY?.trim();
if (!key && existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^INKOS_APIFAST_KEY=(.*)$/);
    if (m) key = m[1].trim().replace(/^["']|["']$/g, "");
  }
}
if (!key) {
  console.log("NO_KEY");
  process.exit(1);
}

const t0 = Date.now();
try {
  const res = await fetch("https://api.apifast.tech/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.5-pro",
      messages: [{ role: "user", content: "只回复OK" }],
      max_tokens: 10,
      stream: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const txt = await res.text();
  console.log("status", res.status, "ms", Date.now() - t0);
  console.log(txt.slice(0, 800));
} catch (e) {
  console.log("ERR", e.name, e.message, "ms", Date.now() - t0);
}

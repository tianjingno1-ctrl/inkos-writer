import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const envText = readFileSync(join(root, ".env"), "utf8");
const match = envText.match(/^INKOS_APIFAST_KEY=(.*)$/m);
if (!match) {
  console.error("INKOS_APIFAST_KEY not found in .env");
  process.exit(1);
}
const apiKey = match[1].trim().replace(/^["']|["']$/g, "");
console.log("key_loaded", Boolean(apiKey), "key_len", apiKey.length);

const res = await fetch("https://api.apifast.tech/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "gemini-2.5-pro",
    messages: [{ role: "user", content: "ping" }],
    max_tokens: 5,
  }),
});
const json = await res.json();
console.log(JSON.stringify({
  status: res.status,
  error: json.error?.message,
  usage: json.usage,
}));

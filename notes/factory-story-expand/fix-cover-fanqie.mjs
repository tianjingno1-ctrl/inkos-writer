#!/usr/bin/env node
/** 任意封面图 → 番茄标准 600×800（3:4 竖版，居中裁切） */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dir = dirname(fileURLToPath(import.meta.url));
const W = 600;
const H = 800;
const RATIO = W / H; // 0.75

const inputs = process.argv.slice(2);
const files =
  inputs.length > 0
    ? inputs
    : [
        join(__dir, "cover-fanqie-600x800.png"),
        join(__dir, "cover.png"),
        join(__dir, "..", "cover-fanqie-600x800.png"),
      ];

async function toFanqie(input) {
  const img = sharp(input);
  const meta = await img.metadata();
  const { width: w, height: h } = meta;
  if (!w || !h) throw new Error(`bad image: ${input}`);

  let cropW = w;
  let cropH = h;
  if (w / h > RATIO) {
    cropW = Math.round(h * RATIO);
    cropH = h;
  } else if (w / h < RATIO) {
    cropW = w;
    cropH = Math.round(w / RATIO);
  }

  const left = Math.max(0, Math.floor((w - cropW) / 2));
  const top = Math.max(0, Math.floor((h - cropH) / 2));

  const buf = await img
    .extract({ left, top, width: cropW, height: cropH })
    .resize(W, H, { fit: "fill" })
    .png()
    .toBuffer();

  return { input, from: `${w}x${h}`, crop: `${cropW}x${cropH}@${left},${top}`, buf };
}

for (const f of files) {
  try {
    readFileSync(f);
  } catch {
    continue;
  }
  const { from, crop, buf } = await toFanqie(f);
  writeFileSync(f, buf);
  console.log("OK", f, from, "→", `${W}x${H}`, `(crop ${crop})`);
}

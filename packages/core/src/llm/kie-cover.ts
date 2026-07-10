import { Buffer } from "node:buffer";

const KIE_DEFAULT_BASE_URL = "https://api.kie.ai";

export function mapSizeToKieAspectRatio(size: string): string {
  const match = /^(\d+)x(\d+)$/i.exec(size.trim());
  if (!match) return "auto";
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return "auto";
  }
  if (width === height) return "1:1";
  return width > height ? "3:2" : "2:3";
}

export function extractKieCreateTaskId(payload: unknown): string | undefined {
  const taskId = (payload as { data?: { taskId?: unknown } }).data?.taskId;
  return typeof taskId === "string" && taskId.trim() ? taskId.trim() : undefined;
}

export function extractKieTaskResultUrls(payload: unknown): ReadonlyArray<string> | undefined {
  const data = (payload as { data?: { state?: unknown; resultJson?: unknown } }).data;
  if (!data || data.state !== "success") return undefined;

  const resultJson = data.resultJson;
  if (typeof resultJson !== "string" || !resultJson.trim()) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(resultJson);
  } catch {
    return undefined;
  }

  const urls = (parsed as { resultUrls?: unknown }).resultUrls;
  if (!Array.isArray(urls)) return undefined;
  const filtered = urls
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .map((url) => url.trim());
  return filtered.length > 0 ? filtered : undefined;
}

export function extractKieTaskFailure(payload: unknown): string | undefined {
  const data = (payload as { data?: { state?: unknown; failMsg?: unknown; failCode?: unknown } }).data;
  if (!data || data.state !== "fail") return undefined;
  const failMsg = typeof data.failMsg === "string" ? data.failMsg.trim() : "";
  const failCode = typeof data.failCode === "string" ? data.failCode.trim() : "";
  return failMsg || failCode || "kie image generation failed";
}

export function isKieTaskPending(payload: unknown): boolean {
  const state = (payload as { data?: { state?: unknown } }).data?.state;
  return state === "waiting" || state === "queuing" || state === "generating";
}

export async function generateKieCover(
  request: { readonly baseUrl: string; readonly model: string; readonly apiKey: string },
  prompt: string,
  size: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ readonly buffer: Buffer; readonly extension: "png" | "jpg" }> {
  const baseUrl = request.baseUrl.replace(/\/+$/u, "") || KIE_DEFAULT_BASE_URL;
  const createResponse = await fetchImpl(`${baseUrl}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      input: {
        prompt,
        aspect_ratio: mapSizeToKieAspectRatio(size),
      },
    }),
  });
  const createText = await createResponse.text();
  if (!createResponse.ok) {
    throw new Error(`kie cover generation failed: HTTP ${createResponse.status} ${createText.slice(0, 500)}`);
  }

  let createPayload: unknown;
  try {
    createPayload = JSON.parse(createText);
  } catch (error) {
    throw new Error(`kie cover generation returned non-JSON response: ${String(error)}`);
  }

  const taskId = extractKieCreateTaskId(createPayload);
  if (!taskId) {
    throw new Error("kie cover generation response did not include taskId.");
  }

  const imageUrl = await pollKieCoverTask(baseUrl, taskId, request.apiKey, fetchImpl);
  return downloadKieCoverImage(imageUrl, request.apiKey, fetchImpl);
}

async function pollKieCoverTask(
  baseUrl: string,
  taskId: string,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const maxAttempts = 90;
  let delayMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await sleep(delayMs);
      delayMs = Math.min(Math.round(delayMs * 1.25), 5000);
    }

    const response = await fetchImpl(
      `${baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`kie cover task query failed: HTTP ${response.status} ${text.slice(0, 500)}`);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(`kie cover task query returned non-JSON response: ${String(error)}`);
    }

    const failure = extractKieTaskFailure(payload);
    if (failure) {
      throw new Error(`kie cover generation failed: ${failure}`);
    }

    const urls = extractKieTaskResultUrls(payload);
    if (urls?.[0]) {
      return urls[0];
    }

    if (!isKieTaskPending(payload)) {
      throw new Error("kie cover generation ended without image URLs.");
    }
  }

  throw new Error("kie cover generation timed out while waiting for task completion.");
}

async function downloadKieCoverImage(
  url: string,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<{ readonly buffer: Buffer; readonly extension: "png" | "jpg" }> {
  const response = await fetchImpl(url);
  const fallbackResponse = response.status === 401 || response.status === 403
    ? await fetchImpl(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    : response;
  if (!fallbackResponse.ok) {
    const text = await fallbackResponse.text();
    throw new Error(`kie cover image download failed: HTTP ${fallbackResponse.status} ${text.slice(0, 300)}`);
  }
  const contentType = fallbackResponse.headers.get("content-type") ?? "";
  const buffer = Buffer.from(await fallbackResponse.arrayBuffer());
  return {
    buffer,
    extension: kieCoverImageExtension(contentType, url),
  };
}

function kieCoverImageExtension(contentType: string, url: string): "png" | "jpg" {
  const normalized = `${contentType} ${url}`.toLowerCase();
  return normalized.includes("jpeg") || normalized.includes(".jpg") || normalized.includes(".jpeg") ? "jpg" : "png";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

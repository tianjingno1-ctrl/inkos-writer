import { describe, expect, it, vi } from "vitest";
import {
  extractKieCreateTaskId,
  extractKieTaskFailure,
  extractKieTaskResultUrls,
  generateKieCover,
  isKieTaskPending,
  mapSizeToKieAspectRatio,
} from "../llm/kie-cover.js";

describe("kie-cover", () => {
  it("maps cover sizes to kie aspect ratios", () => {
    expect(mapSizeToKieAspectRatio("1024x1360")).toBe("2:3");
    expect(mapSizeToKieAspectRatio("1360x1024")).toBe("3:2");
    expect(mapSizeToKieAspectRatio("1024x1024")).toBe("1:1");
    expect(mapSizeToKieAspectRatio("auto")).toBe("auto");
  });

  it("extracts task ids and result urls from kie market responses", () => {
    expect(extractKieCreateTaskId({
      code: 200,
      data: { taskId: "task_gptimage_123" },
    })).toBe("task_gptimage_123");

    expect(extractKieTaskResultUrls({
      data: {
        state: "success",
        resultJson: JSON.stringify({
          resultUrls: ["https://cdn.example.test/cover.png"],
        }),
      },
    })).toEqual(["https://cdn.example.test/cover.png"]);

    expect(extractKieTaskFailure({
      data: {
        state: "fail",
        failMsg: "Generation failed",
      },
    })).toBe("Generation failed");

    expect(isKieTaskPending({ data: { state: "generating" } })).toBe(true);
    expect(isKieTaskPending({ data: { state: "success" } })).toBe(false);
  });

  it("creates a kie task, polls until success, and downloads the image", async () => {
    const fetchMock = vi.fn(async (url: unknown, init?: { readonly body?: unknown }) => {
      const target = String(url);
      if (target.endsWith("/api/v1/jobs/createTask")) {
        return new Response(JSON.stringify({
          code: 200,
          data: { taskId: "task_gptimage_123" },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (target.includes("/api/v1/jobs/recordInfo")) {
        return new Response(JSON.stringify({
          data: {
            state: "success",
            resultJson: JSON.stringify({
              resultUrls: ["https://cdn.example.test/cover.png"],
            }),
          },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if (target === "https://cdn.example.test/cover.png") {
        return new Response(Buffer.from("fake-png"), {
          status: 200,
          headers: { "content-type": "image/png" },
        });
      }
      throw new Error(`unexpected fetch: ${target}`);
    });

    const result = await generateKieCover(
      {
        baseUrl: "https://api.kie.ai",
        model: "gpt-image-2-text-to-image",
        apiKey: "kie-test-key",
      },
      "A cinematic cover prompt",
      "1024x1360",
      fetchMock as never,
    );

    expect(result).toEqual({
      buffer: Buffer.from("fake-png"),
      extension: "png",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.kie.ai/api/v1/jobs/createTask",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("A cinematic cover prompt"),
      }),
    );
    const createCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/v1/jobs/createTask"));
    const createBody = JSON.parse(String((createCall?.[1] as { readonly body?: unknown } | undefined)?.body ?? "{}"));
    expect(createBody).toEqual({
      model: "gpt-image-2-text-to-image",
      input: {
        prompt: "A cinematic cover prompt",
        aspect_ratio: "2:3",
      },
    });
  });
});

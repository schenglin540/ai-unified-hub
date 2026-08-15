import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { OpenAICompatibleProvider, providerRegistry } from "@/domain/providers";
import { server } from "./mocks/server";
import type { AIRequest, AIStreamEvent, ProviderConfig } from "@/domain/types";

const config: ProviderConfig = { id: "provider-test", kind: "custom", name: "Test compatible provider", baseUrl: "https://api.example.com/v1", apiKeyRef: "local:test", defaultModel: "test-model", headers: {}, enabled: true, status: "unverified", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
const request: AIRequest = { id: "request-test", providerId: config.id, model: "test-model", messages: [{ id: "message-1", role: "user", content: "Hello" }], stream: true, createdAt: "2026-01-01T00:00:00.000Z" };

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("OpenAICompatibleProvider", () => {
  const provider = new OpenAICompatibleProvider("custom", "Test compatible provider");
  it("registers compatible presets and validates metadata without exposing a secret", () => {
    expect(providerRegistry.has("openai")).toBe(true);
    expect(providerRegistry.list()).toHaveLength(5);
    expect(provider.validateConfig(config)).toEqual({ valid: true, messages: [] });
  });
  it("discovers OpenAI-compatible models through GET /models", async () => {
    server.use(http.get("https://api.example.com/v1/models", () => HttpResponse.json({ data: [{ id: "test-model", created: 1, owned_by: "test-owner" }] })));
    await expect(provider.listModels(config, "YOUR_API_KEY")).resolves.toEqual([expect.objectContaining({ id: "test-model", ownedBy: "test-owner" })]);
  });
  it("normalizes a non-streaming chat completion and provider usage", async () => {
    server.use(http.post("https://api.example.com/v1/chat/completions", () => HttpResponse.json({ id: "chat-test", model: "test-model", choices: [{ message: { content: "Completed response" } }], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } })));
    const response = await provider.chat({ ...request, stream: false }, config, "YOUR_API_KEY");
    expect(response.content).toBe("Completed response");
    expect(response.metrics.usage?.totalTokens).toBe(5);
  });
  it("parses compatible SSE deltas and completes with a normalized response", async () => {
    const encoder = new TextEncoder();
    server.use(http.post("https://api.example.com/v1/chat/completions", () => new HttpResponse(new ReadableStream({ start(controller) { controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n')); controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"stream"}}]}\n\n')); controller.enqueue(encoder.encode("data: [DONE]\n\n")); controller.close(); } }), { headers: { "Content-Type": "text/event-stream" } })));
    const events: AIStreamEvent[] = [];
    for await (const event of provider.streamChat(request, config, "YOUR_API_KEY")) events.push(event);
    expect(events.filter((event) => event.type === "delta").map((event) => event.type === "delta" ? event.value : "").join("")).toBe("Hello stream");
    expect(events.at(-1)?.type).toBe("completed");
  });
  it("maps HTTP authentication failures to safe actionable diagnostics", async () => {
    server.use(http.post("https://api.example.com/v1/chat/completions", () => HttpResponse.json({ error: { message: "Invalid authentication" } }, { status: 401 })));
    await expect(provider.chat({ ...request, stream: false }, config, "YOUR_API_KEY")).rejects.toMatchObject({ name: "ProviderRequestError", status: 401 });
    const error = provider.normalizeError(new Error("Failed to fetch"));
    expect(error).toMatchObject({ category: "network", title: "Network Request Failed" });
    expect(error.message).not.toContain("YOUR_API_KEY");
  });
});

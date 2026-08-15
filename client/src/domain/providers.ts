/**
 * 精密工作台风格契约：一个 OpenAI-Compatible Adapter 处理浏览器直连，UI 不拼接请求头、不保存密钥、不感知厂商差异。
 */
import { errorAnalyzer } from "./errors";
import type { AIRequest, AIResponse, AIStreamEvent, ModelInfo, ProviderConfig, ProviderConnectionResult, ProviderError, ProviderKind, RequestMetrics, TokenUsage } from "./types";

export interface AIProvider {
  readonly kind: ProviderKind;
  readonly displayName: string;
  validateConfig(config: ProviderConfig): { valid: boolean; messages: string[] };
  testConnection(config: ProviderConfig, apiKey: string, signal?: AbortSignal): Promise<ProviderConnectionResult>;
  listModels(config: ProviderConfig, apiKey: string, signal?: AbortSignal): Promise<ModelInfo[]>;
  chat(request: AIRequest, config: ProviderConfig, apiKey: string, signal?: AbortSignal): Promise<AIResponse>;
  streamChat(request: AIRequest, config: ProviderConfig, apiKey: string, signal?: AbortSignal): AsyncIterable<AIStreamEvent>;
  normalizeError(error: unknown): ProviderError;
  getModelInfo(modelId: string, models?: ModelInfo[]): ModelInfo;
}

export class ProviderRequestError extends Error {
  constructor(message: string, readonly status?: number, readonly safePayload?: unknown) { super(message); this.name = "ProviderRequestError"; }
}

const now = () => new Date().toISOString();
const timestamp = () => (typeof performance === "undefined" ? Date.now() : performance.now());
const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");
const endpoint = (config: ProviderConfig, path: string) => `${normalizeBaseUrl(config.baseUrl)}${path}`;
const usageFrom = (usage: unknown): TokenUsage | undefined => {
  if (!usage || typeof usage !== "object") return undefined;
  const source = usage as Record<string, unknown>;
  const inputTokens = typeof source.prompt_tokens === "number" ? source.prompt_tokens : typeof source.input_tokens === "number" ? source.input_tokens : undefined;
  const outputTokens = typeof source.completion_tokens === "number" ? source.completion_tokens : typeof source.output_tokens === "number" ? source.output_tokens : undefined;
  const totalTokens = typeof source.total_tokens === "number" ? source.total_tokens : inputTokens !== undefined || outputTokens !== undefined ? (inputTokens || 0) + (outputTokens || 0) : undefined;
  return inputTokens === undefined && outputTokens === undefined && totalTokens === undefined ? undefined : { inputTokens, outputTokens, totalTokens };
};
const textContent = (content: unknown) => typeof content === "string" ? content : Array.isArray(content) ? content.map((part) => typeof part === "string" ? part : typeof part === "object" && part && "text" in part ? String((part as { text: unknown }).text) : "").join("") : "";
const safeErrorText = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "The provider returned an error.";
  const source = payload as Record<string, unknown>; const nested = source.error && typeof source.error === "object" ? source.error as Record<string, unknown> : source;
  return typeof nested.message === "string" ? nested.message.slice(0, 500) : "The provider returned an error.";
};
const safeResponseHeaders = (headers: Headers) => { const safe: Record<string, string> = {}; headers.forEach((value, key) => { if (!/^(authorization|set-cookie|x-api-key|api-key|api_key|x-auth-token)$/i.test(key)) safe[key] = value; }); return safe; };

export class OpenAICompatibleProvider implements AIProvider {
  readonly kind: ProviderKind;
  readonly displayName: string;
  constructor(kind: ProviderKind = "custom", displayName = "OpenAI-compatible") { this.kind = kind; this.displayName = displayName; }
  validateConfig(config: ProviderConfig) { const messages: string[] = []; if (!config.name.trim()) messages.push("Provider name is required."); if (!/^https?:\/\//.test(config.baseUrl)) messages.push("Base URL must begin with http:// or https://."); if (!config.defaultModel?.trim()) messages.push("A default model is recommended."); return { valid: messages.length === 0, messages }; }
  private headers(config: ProviderConfig, apiKey: string) { return { "Content-Type": "application/json", ...config.headers, Authorization: `Bearer ${apiKey}` }; }
  private async responseJson(response: Response) {
    const text = await response.text(); let payload: unknown = {};
    if (text) { try { payload = JSON.parse(text); } catch { throw new ProviderRequestError("The provider returned a non-JSON response.", response.status, { contentType: response.headers.get("content-type") || "unknown" }); } }
    if (!response.ok) throw new ProviderRequestError(safeErrorText(payload), response.status, payload);
    return payload;
  }
  async listModels(config: ProviderConfig, apiKey: string, signal?: AbortSignal): Promise<ModelInfo[]> {
    const response = await fetch(endpoint(config, "/models"), { method: "GET", headers: this.headers(config, apiKey), signal });
    const payload = await this.responseJson(response) as { data?: unknown[] };
    if (!Array.isArray(payload.data)) throw new ProviderRequestError("The provider returned an unexpected model list.", response.status, { payloadType: typeof payload });
    return payload.data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string")).map((item) => ({ id: String(item.id), displayName: String(item.id), providerId: config.id, supportsStreaming: true, created: typeof item.created === "number" ? item.created : undefined, ownedBy: typeof item.owned_by === "string" ? item.owned_by : undefined }));
  }
  async testConnection(config: ProviderConfig, apiKey: string, signal?: AbortSignal): Promise<ProviderConnectionResult> {
    const started = timestamp();
    try {
      const models = await this.listModels(config, apiKey, signal);
      return { providerId: config.id, endpoint: endpoint(config, "/models"), latencyMs: Math.round(timestamp() - started), models, modelsDiscovered: true, connectedAt: now() };
    } catch (error) {
      if (error instanceof ProviderRequestError && error.status === 404) return { providerId: config.id, endpoint: endpoint(config, "/models"), latencyMs: Math.round(timestamp() - started), models: [], modelsDiscovered: false, connectedAt: now() };
      throw error;
    }
  }
  private buildResponse(request: AIRequest, config: ProviderConfig, payload: unknown, metrics: RequestMetrics, status: number, headers?: Record<string, string>): AIResponse {
    const body = payload as Record<string, unknown>; const choices = Array.isArray(body.choices) ? body.choices : [];
    const first = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : undefined;
    const message = first?.message && typeof first.message === "object" ? first.message as Record<string, unknown> : {};
    const content = textContent(message.content);
    if (!content && !first) throw new ProviderRequestError("The provider response did not contain a completion choice.", status, { responseShape: "missing choices" });
    metrics.usage = usageFrom(body.usage);
    return { id: typeof body.id === "string" ? body.id : `response-${Date.now()}`, requestId: request.id, provider: config.name, model: typeof body.model === "string" ? body.model : request.model, content, raw: payload, httpStatus: status, headers, metrics };
  }
  async chat(request: AIRequest, config: ProviderConfig, apiKey: string, signal?: AbortSignal): Promise<AIResponse> {
    const started = timestamp(); const startedAt = now();
    const response = await fetch(endpoint(config, "/chat/completions"), { method: "POST", headers: this.headers(config, apiKey), signal, body: JSON.stringify({ model: request.model, messages: request.messages.map(({ role, content }) => ({ role, content })), temperature: request.temperature, max_tokens: request.maxTokens, stream: false }) });
    const payload = await this.responseJson(response); const completedAt = now();
    return this.buildResponse(request, config, payload, { startedAt, completedAt, requestTimeMs: Math.round(timestamp() - started), latencyMs: Math.round(timestamp() - started) }, response.status, safeResponseHeaders(response.headers));
  }
  async *streamChat(request: AIRequest, config: ProviderConfig, apiKey: string, signal?: AbortSignal): AsyncIterable<AIStreamEvent> {
    const started = timestamp(); const startedAt = now(); let content = ""; let usage: TokenUsage | undefined; let receivedDelta = false; let ttftMs: number | undefined;
    try {
      const response = await fetch(endpoint(config, "/chat/completions"), { method: "POST", headers: this.headers(config, apiKey), signal, body: JSON.stringify({ model: request.model, messages: request.messages.map(({ role, content: messageContent }) => ({ role, content: messageContent })), temperature: request.temperature, max_tokens: request.maxTokens, stream: true }) });
      if (!response.ok) await this.responseJson(response);
      if (!response.body) throw new ProviderRequestError("The provider did not return a readable response stream.", response.status);
      yield { type: "stream-started", at: now() };
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let done = false;
      while (!done) {
        const chunk = await reader.read(); done = chunk.done;
        buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !done });
        const lines = buffer.split(/\r?\n/); buffer = lines.pop() || "";
        for (let index = 0; index < lines.length; index += 1) {
          const line = lines[index].trim(); if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim(); if (!data || data === "[DONE]") continue;
          let event: Record<string, unknown>;
          try { event = JSON.parse(data) as Record<string, unknown>; } catch { throw new ProviderRequestError("A streaming event contained invalid JSON.", response.status); }
          if (event.error) throw new ProviderRequestError(safeErrorText(event), response.status, event.error);
          const choices = Array.isArray(event.choices) ? event.choices : []; const choice = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : undefined; const delta = choice?.delta && typeof choice.delta === "object" ? choice.delta as Record<string, unknown> : {};
          const value = textContent(delta.content); if (value) { receivedDelta = true; if (ttftMs === undefined) ttftMs = Math.round(timestamp() - started); content += value; yield { type: "delta", value, at: now() }; }
          const eventUsage = usageFrom(event.usage); if (eventUsage) { usage = eventUsage; yield { type: "usage", usage, at: now() }; }
        }
      }
      if (!receivedDelta) throw new ProviderRequestError("The stream completed without response content.", response.status);
      const metrics: RequestMetrics = { startedAt, completedAt: now(), requestTimeMs: Math.round(timestamp() - started), latencyMs: Math.round(timestamp() - started), ttftMs, usage };
      yield { type: "completed", at: now(), response: { id: `stream-${Date.now()}`, requestId: request.id, provider: config.name, model: request.model, content, raw: { stream: true, usage }, httpStatus: response.status, headers: safeResponseHeaders(response.headers), metrics } };
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) { yield { type: "aborted", at: now() }; return; }
      yield { type: "failed", at: now(), error: this.normalizeError(error) };
    }
  }
  normalizeError(error: unknown): ProviderError {
    if (error instanceof ProviderRequestError) { const lower = error.message.toLowerCase(); const hint = lower.includes("context") ? "context length exceeded" : lower.includes("model") ? "invalid model" : lower.includes("non-json") || lower.includes("invalid json") ? "malformed response" : undefined; return errorAnalyzer.analyze({ status: error.status, message: hint, malformed: lower.includes("non-json") || lower.includes("invalid json") }); }
    if (error instanceof DOMException && error.name === "AbortError") return errorAnalyzer.analyze({ aborted: true });
    const message = error instanceof Error ? error.message : "The browser could not complete the request.";
    return errorAnalyzer.analyze({ message });
  }
  getModelInfo(modelId: string, models: ModelInfo[] = []) { return models.find((model) => model.id === modelId) || { id: modelId, displayName: modelId, supportsStreaming: true }; }
}

export const providerMetadata: Record<ProviderKind, { label: string; defaultBaseUrl: string }> = {
  openai: { label: "OpenAI", defaultBaseUrl: "https://api.openai.com/v1" }, deepseek: { label: "DeepSeek", defaultBaseUrl: "https://api.deepseek.com" }, qwen: { label: "Qwen", defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" }, openrouter: { label: "OpenRouter", defaultBaseUrl: "https://openrouter.ai/api/v1" }, custom: { label: "Custom compatible provider", defaultBaseUrl: "" },
};

export class ProviderRegistry {
  private readonly providers = new Map<ProviderKind, AIProvider>();
  register(provider: AIProvider) { this.providers.set(provider.kind, provider); return this; }
  unregister(kind: ProviderKind) { this.providers.delete(kind); }
  get(kind: ProviderKind) { return this.providers.get(kind); }
  has(kind: ProviderKind) { return this.providers.has(kind); }
  list() { return Array.from(this.providers.values()); }
}

export const providerRegistry = (Object.keys(providerMetadata) as ProviderKind[]).reduce((registry, kind) => registry.register(new OpenAICompatibleProvider(kind, providerMetadata[kind].label)), new ProviderRegistry());

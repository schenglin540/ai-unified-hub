/**
 * 精密工作台风格契约：领域模型不含 UI 或厂商实现细节，所有可持久化数据均保持 Local-first 且不携带凭据。
 */
export type ProviderKind = "openai" | "deepseek" | "qwen" | "openrouter" | "custom";
export type MessageRole = "system" | "user" | "assistant";
export type RequestStatus = "idle" | "loading" | "sending" | "streaming" | "completed" | "failed" | "aborted" | "retrying" | "no-provider" | "no-model" | "network-error" | "cors-error" | "invalid-configuration";
export type ErrorCategory = "bad-request" | "authentication" | "forbidden" | "not-found" | "timeout" | "conflict" | "rate-limit" | "server" | "network" | "cors" | "invalid-model" | "invalid-base-url" | "context-length" | "malformed-response" | "response" | "streaming" | "unknown";
export type CodeLanguage = "curl" | "python" | "javascript" | "node";

export interface ProviderConfig { id: string; kind: ProviderKind; name: string; baseUrl: string; apiKeyRef: string; defaultModel?: string; headers?: Record<string, string>; enabled: boolean; isDefault?: boolean; lastTestedAt?: string; lastLatencyMs?: number; status: "unverified" | "ready" | "failed"; createdAt: string; updatedAt: string; }
export interface ModelInfo { id: string; displayName: string; providerId?: string; supportsStreaming: boolean; created?: number; ownedBy?: string; capabilities?: string[]; contextWindow?: number; inputPricePerMillion?: number; outputPricePerMillion?: number; }
export interface ModelPricing { inputPerMillionTokens: number; outputPerMillionTokens: number; currency?: string; }
export interface ProviderConnectionResult { providerId: string; endpoint: string; latencyMs: number; models: ModelInfo[]; modelsDiscovered: boolean; connectedAt: string; }
export interface Message { id: string; role: MessageRole; content: string; }
export interface AIRequest { id: string; providerId: string; model: string; messages: Message[]; temperature?: number; maxTokens?: number; stream: boolean; createdAt: string; }
export interface TokenUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number; }
export interface RequestMetrics { startedAt: string; completedAt?: string; requestTimeMs?: number; latencyMs?: number; ttftMs?: number; usage?: TokenUsage; estimatedCost?: number; }
export interface AIResponse { id: string; requestId: string; provider: string; model: string; content: string; raw: unknown; httpStatus?: number; headers?: Record<string, string>; metrics: RequestMetrics; isPrototype?: boolean; }
export type AIStreamEvent = { type: "stream-started"; at: string } | { type: "delta"; value: string; at: string } | { type: "usage"; usage: TokenUsage; at: string } | { type: "completed"; response: AIResponse; at: string } | { type: "failed"; error: ProviderError; at: string } | { type: "aborted"; at: string };
export interface ProviderError { category: ErrorCategory; title: string; description: string; message: string; status?: number; providerCode?: string; retryable: boolean; causes: string[]; actions: string[]; safeDetails?: Record<string, unknown>; }
export interface RequestRecord { id: string; request: AIRequest; response?: AIResponse; error?: ProviderError; status: RequestStatus; providerName: string; model: string; metrics: RequestMetrics; createdAt: string; isDemo?: boolean; }
export interface SavedPrompt { id: string; name: string; description?: string; messages: Message[]; tags: string[]; favorite?: boolean; createdAt: string; updatedAt: string; }
export interface PanelLayout { configuration: number; composer: number; inspector: number; }
export interface AppSettings { theme: "light" | "dark" | "system"; defaultProviderId?: string; defaultModel?: string; defaultTemperature: number; defaultMaxTokens: number; historyRetention: "7d" | "30d" | "90d" | "forever"; promptRetention: "30d" | "90d" | "forever"; proxyMode: "direct" | "self-hosted-placeholder"; demoMode: boolean; panelLayout: PanelLayout; }
export interface WorkspaceExport { schemaVersion: 1; exportedAt: string; providers: Array<Omit<ProviderConfig, "apiKeyRef">>; prompts: SavedPrompt[]; history: RequestRecord[]; settings: AppSettings; }
export interface CodeGenerationRequest { request: AIRequest; provider: Pick<ProviderConfig, "baseUrl" | "name">; language: CodeLanguage; }

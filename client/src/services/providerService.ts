/**
 * 精密工作台风格契约：服务层在短暂内存中取用解密密钥，随后交给统一 Adapter；不记录凭据、不使用项目服务器。
 */
import { errorAnalyzer } from "@/domain/errors";
import { providerRegistry } from "@/domain/providers";
import type { DiagnosticSource } from "@/domain/diagnostics";
import { recordDiagnostic } from "@/services/diagnosticsService";
import { secretRepository } from "@/storage/indexedDb";
import type { AIRequest, AIResponse, AIStreamEvent, ModelInfo, ProviderConfig, ProviderConnectionResult, ProviderError } from "@/domain/types";

const adapterFor = (config: ProviderConfig) => providerRegistry.get(config.kind) || providerRegistry.get("custom");

export async function testProviderConnection(config: ProviderConfig, apiKey?: string, signal?: AbortSignal): Promise<ProviderConnectionResult> {
  const secret = apiKey || await secretRepository.getSecret(config.apiKeyRef);
  if (!secret) throw errorAnalyzer.analyze({ status: 401, message: "No API key is available for this local provider configuration." });
  const adapter = adapterFor(config);
  if (!adapter) throw errorAnalyzer.analyze({ message: "No compatible provider adapter is registered." });
  try { return await adapter.testConnection(config, secret, signal); } catch (error) { const normalized = adapter.normalizeError(error); void recordDiagnostic("provider-test", normalized, { providerId: config.id, providerName: config.name, endpoint: config.baseUrl }); throw normalized; }
}

export async function discoverModels(config: ProviderConfig, signal?: AbortSignal): Promise<ModelInfo[]> {
  const secret = await secretRepository.getSecret(config.apiKeyRef);
  if (!secret) throw errorAnalyzer.analyze({ status: 401, message: "No API key is available for this local provider configuration." });
  const adapter = adapterFor(config);
  if (!adapter) throw errorAnalyzer.analyze({ message: "No compatible provider adapter is registered." });
  try { return await adapter.listModels(config, secret, signal); } catch (error) { throw adapter.normalizeError(error); }
}

export async function sendProviderRequest(request: AIRequest, config: ProviderConfig, signal?: AbortSignal, source: DiagnosticSource = "playground"): Promise<AIResponse> {
  const secret = await secretRepository.getSecret(config.apiKeyRef);
  if (!secret) throw errorAnalyzer.analyze({ status: 401, message: "No API key is available for this local provider configuration." });
  const adapter = adapterFor(config);
  if (!adapter) throw errorAnalyzer.analyze({ message: "No compatible provider adapter is registered." });
  try { return await adapter.chat(request, config, secret, signal); } catch (error) { const normalized = adapter.normalizeError(error); void recordDiagnostic(source, normalized, { providerId: config.id, providerName: config.name, model: request.model, endpoint: config.baseUrl }); throw normalized; }
}

export async function* streamProviderRequest(request: AIRequest, config: ProviderConfig, signal?: AbortSignal, source: DiagnosticSource = "playground"): AsyncIterable<AIStreamEvent> {
  const secret = await secretRepository.getSecret(config.apiKeyRef);
  if (!secret) { yield { type: "failed", at: new Date().toISOString(), error: errorAnalyzer.analyze({ status: 401, message: "No API key is available for this local provider configuration." }) }; return; }
  const adapter = adapterFor(config);
  if (!adapter) { yield { type: "failed", at: new Date().toISOString(), error: errorAnalyzer.analyze({ message: "No compatible provider adapter is registered." }) }; return; }
  try { for await (const event of adapter.streamChat(request, config, secret, signal)) { if (event.type === "failed") void recordDiagnostic(source, event.error, { providerId: config.id, providerName: config.name, model: request.model, endpoint: config.baseUrl }); yield event; } } catch (error) { const normalized = adapter.normalizeError(error); void recordDiagnostic(source, normalized, { providerId: config.id, providerName: config.name, model: request.model, endpoint: config.baseUrl }); yield { type: "failed", at: new Date().toISOString(), error: normalized }; }
}

export const normalizeProviderError = (error: unknown): ProviderError => {
  if (typeof error === "object" && error && "category" in error && "title" in error) return error as ProviderError;
  return errorAnalyzer.analyze({ message: error instanceof Error ? error.message : typeof error === "object" && error && "message" in error && typeof (error as { message: unknown }).message === "string" ? (error as { message: string }).message : "The provider operation could not be completed." });
};

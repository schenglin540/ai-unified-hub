import { describe, expect, it } from "vitest";
import { codeGenerator } from "@/domain/codegen";
import type { AIRequest, CodeLanguage } from "@/domain/types";

const request: AIRequest = { id: "request-code", providerId: "provider-code", model: "test-model", messages: [{ id: "user", role: "user", content: "Explain local storage" }], temperature: 0.7, maxTokens: 512, stream: false, createdAt: "2026-01-01T00:00:00.000Z" };

describe("OpenAICompatibleCodeGenerator", () => {
  (["curl", "python", "javascript", "node"] as CodeLanguage[]).forEach((language) => it(`generates a safe ${language} snippet`, () => { const output = codeGenerator.generate({ request, provider: { name: "Test", baseUrl: "https://api.example.com/v1" }, language }); expect(output).toContain("YOUR_API_KEY"); expect(output).toContain("test-model"); expect(output).not.toContain("sk-"); }));
});

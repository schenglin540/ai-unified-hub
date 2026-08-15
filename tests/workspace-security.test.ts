import { describe, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";
import type { ProviderConfig } from "@/domain/types";

const provider: ProviderConfig = { id: "export-provider", kind: "custom", name: "Export local", baseUrl: "https://api.example.com/v1", apiKeyRef: "local:export-provider", headers: { "X-Trace": "safe", Authorization: "Bearer YOUR_API_KEY" }, enabled: true, status: "unverified", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
describe("workspace export security", () => {
  it("omits API key references and sensitive headers from export", () => { useAppStore.setState((state) => ({ ...state, providers: [provider] })); const snapshot = useAppStore.getState().exportWorkspace(); const serialized = JSON.stringify(snapshot); expect(serialized).not.toContain("YOUR_API_KEY"); expect(serialized).not.toContain("apiKeyRef"); expect(snapshot.providers[0].headers).toEqual({ "X-Trace": "safe" }); });
});


import { describe, expect, it } from "vitest";
import { RuleBasedErrorAnalyzer } from "@/domain/errors";

describe("RuleBasedErrorAnalyzer", () => {
  const analyzer = new RuleBasedErrorAnalyzer();
  it("maps the required HTTP categories to safe action-oriented diagnostics", () => {
    const expectations = [[401, "authentication"], [403, "forbidden"], [404, "not-found"], [408, "timeout"], [429, "rate-limit"], [500, "server"], [502, "server"], [503, "server"]] as const;
    expectations.forEach(([status, category]) => { const error = analyzer.analyze({ status }); expect(error.category).toBe(category); expect(error.title).toBeTruthy(); expect(error.description).toBeTruthy(); expect(error.actions.length).toBeGreaterThan(0); });
  });
  it("identifies CORS/network, context, malformed response, and interrupted stream paths", () => {
    expect(analyzer.analyze({ message: "Failed to fetch" }).category).toBe("network");
    expect(analyzer.analyze({ message: "context length exceeded" }).category).toBe("context-length");
    expect(analyzer.analyze({ malformed: true }).category).toBe("malformed-response");
    expect(analyzer.analyze({ streaming: true }).category).toBe("streaming");
  });
  it("redacts key-like values before returning a diagnostic", () => {
    const error = analyzer.analyze({ message: "Bearer x" });
    expect(error.message).not.toContain("Bearer x");
  });
});

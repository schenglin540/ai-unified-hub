import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusIndicator } from "@/components/ToolPrimitives";

describe("StatusIndicator", () => { it("renders text alongside status color semantics", () => { render(<StatusIndicator status="cors-error" />); expect(screen.getByText("CORS error")).toBeInTheDocument(); }); });

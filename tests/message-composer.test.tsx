import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageComposer } from "@/components/MessageComposer";
import type { Message } from "@/domain/types";

const messages: Message[] = [{ id: "system", role: "system", content: "Be precise" }, { id: "user", role: "user", content: "Hello" }];
describe("MessageComposer", () => {
  it("adds, duplicates, reorders and removes local messages", () => { const onChange = vi.fn(); const view = render(<MessageComposer messages={messages} onChange={onChange} />); fireEvent.click(screen.getAllByRole("button", { name: "Duplicate message" })[0]); expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ role: "system", content: "Be precise" })])); fireEvent.click(screen.getAllByRole("button", { name: "Move message down" })[0]); expect(onChange).toHaveBeenCalled(); fireEvent.click(screen.getAllByRole("button", { name: "Delete message" })[0]); expect(onChange).toHaveBeenCalled(); fireEvent.click(screen.getByRole("button", { name: "+ assistant" })); expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ role: "assistant", content: "" })])); view.unmount(); });
  it("updates role and multi-line content", () => { const onChange = vi.fn(); render(<MessageComposer messages={messages} onChange={onChange} />); fireEvent.change(screen.getByLabelText("user message"), { target: { value: "Line one\nLine two" } }); expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ content: "Line one\nLine two" })])); fireEvent.change(screen.getByLabelText("Message 2 role"), { target: { value: "assistant" } }); expect(onChange).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ role: "assistant" })])); });
});

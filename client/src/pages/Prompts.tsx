/** 精密工作台风格契约：Saved Prompts 是 Local-first 请求配方库；使用配方仅在当前浏览器会话内传递消息。 */
import { BookmarkPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { EmptyState, PanelHeading, SignalTrace } from "@/components/ToolPrimitives";
import { PromptLibraryDialog } from "@/components/PromptLibraryDialog";
import { useAppStore } from "@/store/useAppStore";
import type { Message } from "@/domain/types";

export default function Prompts() {
  const [, navigate] = useLocation(); const { prompts } = useAppStore(); const [draftMessages, setDraftMessages] = useState<Message[]>([]);
  useEffect(() => { const stored = sessionStorage.getItem("openapi-playground-prompt-draft"); if (!stored) return; try { const parsed: unknown = JSON.parse(stored); if (Array.isArray(parsed)) setDraftMessages(parsed as Message[]); } finally { sessionStorage.removeItem("openapi-playground-prompt-draft"); } }, []);
  const apply = (messages: Parameters<NonNullable<React.ComponentProps<typeof PromptLibraryDialog>["onUse"]>>[0]) => { sessionStorage.setItem("openapi-playground-prompt-to-use", JSON.stringify(messages)); navigate("/playground"); };
  return <div className="page-canvas"><section className="page-header"><div><p className="eyebrow">Local request recipes</p><h2>Saved prompts.</h2><p>Reusable message sequences remain in this browser. They do not contain Provider API keys, authorization headers, or cloud-synced content.</p></div></section><div className="panel"><PanelHeading eyebrow="Prompt library" title={`${prompts.length} saved recipe${prompts.length === 1 ? "" : "s"}`} /><div className="px-4 pt-3"><SignalTrace labels={["Compose", "Save locally", "Reuse"]} active={prompts.length ? 2 : 0} caption="Prompt trajectory" /></div><EmptyState icon={<BookmarkPlus className="h-5 w-5" />} title={prompts.length ? "Open the library to manage recipes" : "No saved prompts yet"} description={prompts.length ? "Search, favorite, edit metadata, duplicate, delete, or apply a local recipe to Playground." : "Create a multi-message request in Playground, then save it as a reusable local recipe."} /></div><PromptLibraryDialog open onOpenChange={(open) => { if (!open) navigate("/playground"); }} draftMessages={draftMessages} onUse={apply} /></div>;
}

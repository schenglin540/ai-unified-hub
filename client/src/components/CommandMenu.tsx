/**
 * 精密工作台风格契约：键盘命令即时响应且提供明确导航，不依赖动画隐藏关键操作。
 */
import { useEffect, useMemo, useState } from "react";
import { Command, Keyboard, Plus, Send, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";

const commands = [
  { label: "New API request", hint: "⌘ ↵", href: "/playground", icon: Send }, { label: "Add provider", hint: "", href: "#provider", icon: Plus },
  { label: "Compare models", hint: "", href: "/compare", icon: Command }, { label: "Keyboard shortcuts", hint: "", href: "/settings#shortcuts", icon: Keyboard },
];

export function CommandMenu() {
  const { commandOpen, setCommandOpen, setProviderDialogOpen } = useAppStore(); const [, setLocation] = useLocation(); const [query, setQuery] = useState("");
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") setCommandOpen(false); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [setCommandOpen]);
  const filtered = useMemo(() => commands.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);
  if (!commandOpen) return null;
  const execute = (href: string) => { if (href === "#provider") setProviderDialogOpen(true); else setLocation(href); setCommandOpen(false); setQuery(""); };
  return <div className="command-overlay" role="presentation"><section className="command-menu" role="dialog" aria-label="Command menu"><div className="command-search"><Command className="h-4 w-4" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands" /><Button variant="ghost" size="icon" onClick={() => setCommandOpen(false)}><X className="h-4 w-4" /></Button></div><div className="command-list"><p>Quick actions</p>{filtered.map((item) => { const Icon = item.icon; return <button onClick={() => execute(item.href)} key={item.label}><span><Icon className="h-4 w-4" />{item.label}</span>{item.hint && <kbd>{item.hint}</kbd>}</button>})}</div><footer><span><kbd>↑↓</kbd> Navigate</span><span><kbd>↵</kbd> Select</span><span><kbd>Esc</kbd> Close</span></footer></section></div>;
}

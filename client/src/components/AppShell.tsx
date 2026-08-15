/**
 * 精密工作台风格契约：固定侧轨与上下文栏承载长时工作流，避免 SaaS 顶部导航与营销式 Hero。
 */
import { type ReactNode, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { BookOpenText, BookmarkPlus, Braces, ChevronRight, Command, FileClock, Gauge, GitCompareArrows, Keyboard, Moon, PanelLeftClose, PanelLeftOpen, PlugZap, Settings2, ShieldCheck, Stethoscope, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { ProviderDialog } from "./ProviderDialog";
import { CommandMenu } from "./CommandMenu";

const navigation: Array<[string, string, LucideIcon]> = [
  ["/", "Dashboard", Gauge], ["/playground", "Playground", Braces], ["/compare", "Compare", GitCompareArrows],
  ["/history", "History", FileClock], ["/diagnostics", "Diagnostics", Stethoscope], ["/prompts", "Saved prompts", BookmarkPlus], ["/providers", "Providers", PlugZap], ["/docs", "Documentation", BookOpenText],
];

function useThemePreference() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  useEffect(() => {
    const stored = localStorage.getItem("openapi-playground-theme") as "light" | "dark" | "system" | null;
    const selected = stored || "system";
    setTheme(selected);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", selected === "dark" || (selected === "system" && media.matches));
    apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply);
  }, []);
  const choose = (next: "light" | "dark" | "system") => {
    localStorage.setItem("openapi-playground-theme", next); setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  };
  return { theme, choose };
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { providers, setCommandOpen, hydrate } = useAppStore();
  const { theme, choose } = useThemePreference();
  const page = navigation.find(([href]) => href === location)?.[1] || (location === "/settings" ? "Settings" : "Workspace");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
    };
    document.addEventListener("keydown", onKeyDown); return () => document.removeEventListener("keydown", onKeyDown);
  }, [setCommandOpen]);
  useEffect(() => { void hydrate(); }, [hydrate]);
  return <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
    <aside className="app-sidebar">
      <div className="brand-row"><Link href="/" className="brand"><img src="/manus-storage/openapi-playground-logo_f80745aa.png" alt="OpenAPI Playground" /><span>OpenAPI<span className="brand-muted"> Playground</span></span></Link><Button variant="ghost" size="icon" className="collapse-button" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</Button></div>
      <nav aria-label="Primary navigation"><p className="nav-label">Workspace</p>{navigation.slice(0, 3).map(([href, label, Icon]) => <Link href={href as string} key={href} className={cn("nav-item", location === href && "nav-item-active")}><Icon className="h-4 w-4" /><span>{label as string}</span></Link>)}<p className="nav-label nav-label-second">Library</p>{navigation.slice(3).map(([href, label, Icon]) => <Link href={href as string} key={href} className={cn("nav-item", location === href && "nav-item-active")}><Icon className="h-4 w-4" /><span>{label as string}</span></Link>)}<Link href="/settings" className={cn("nav-item", location === "/settings" && "nav-item-active")}><Settings2 className="h-4 w-4" /><span>Settings</span></Link></nav>
      <div className="sidebar-bottom"><button className="privacy-status" onClick={() => setCommandOpen(true)}><ShieldCheck className="h-4 w-4" /><span><strong>Local-first</strong><small>{providers.length ? `${providers.length} local provider${providers.length > 1 ? "s" : ""}` : "No providers stored"}</small></span></button><div className="theme-row"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => choose(theme === "dark" ? "light" : "dark")} aria-label="Toggle dark mode">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent>Theme: {theme}</TooltipContent></Tooltip><Button variant="ghost" size="icon" onClick={() => setCommandOpen(true)} aria-label="Keyboard shortcuts"><Keyboard className="h-4 w-4" /></Button><span className="version">v1.0.0</span></div></div>
    </aside>
    <main className="workspace"><header className="context-bar"><div><p className="crumb">OpenAPI Playground <ChevronRight className="inline h-3 w-3" /> <span>{page}</span></p><h1>{page}</h1></div><div className="context-actions"><Button variant="outline" size="sm" className="command-trigger" onClick={() => setCommandOpen(true)}><Command className="h-3.5 w-3.5" /> Command <kbd>⌘ K</kbd></Button></div></header>{children}</main><ProviderDialog /><CommandMenu /></div>;
}

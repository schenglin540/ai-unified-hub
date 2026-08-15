/** 精密工作台风格契约：应用路由全部置于固定侧轨工作台中，不出现营销式页面；页面按需加载，保持首屏克制。 */
import { lazy, Suspense } from "react";
import "./rc-instrument-trays.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Route, Switch } from "wouter";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Playground = lazy(() => import("@/pages/Playground"));
const Compare = lazy(() => import("@/pages/Compare"));
const Providers = lazy(() => import("@/pages/Providers"));
const History = lazy(() => import("@/pages/History"));
const Settings = lazy(() => import("@/pages/Settings"));
const Prompts = lazy(() => import("@/pages/Prompts"));
const Docs = lazy(() => import("@/pages/Docs"));
const Diagnostics = lazy(() => import("@/pages/Diagnostics"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function WorkspaceLoading() {
  return <div className="workspace-loading" role="status" aria-live="polite">Loading workspace view…</div>;
}

function Router() {
  return <AppShell><Suspense fallback={<WorkspaceLoading />}><Switch>
    <Route path="/" component={Dashboard} /><Route path="/playground" component={Playground} />
    <Route path="/compare" component={Compare} /><Route path="/providers" component={Providers} />
    <Route path="/history" component={History} /><Route path="/diagnostics" component={Diagnostics} /><Route path="/prompts" component={Prompts} /><Route path="/settings" component={Settings} />
    <Route path="/docs" component={Docs} /><Route component={NotFound} />
  </Switch></Suspense></AppShell>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

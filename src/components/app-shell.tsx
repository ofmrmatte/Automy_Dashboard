import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Boxes, ChartNoAxesCombined, ChevronLeft, CircleDollarSign, FileText, Headphones, LayoutDashboard, Menu, Moon, Search, Settings, Sun, Users, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "./ui";
import { cn } from "../lib/utils";

const nav = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard }, { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Contratos", to: "/contratos", icon: FileText }, { label: "Produtos", to: "/produtos", icon: Boxes },
  { label: "Financeiro", to: "/financeiro", icon: CircleDollarSign }, { label: "Suporte", to: "/suporte", icon: Headphones },
  { label: "Relatórios", to: "/relatorios", icon: ChartNoAxesCombined }, { label: "Configurações", to: "/configuracoes", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false); const [mobile, setMobile] = useState(false); const [dark, setDark] = useState(false);
  useEffect(() => { const stored = localStorage.getItem("automy-theme"); const useDark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; setDark(useDark); document.documentElement.classList.toggle("dark", useDark); }, []);
  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("automy-theme", next ? "dark" : "light"); };
  return <div className="min-h-screen bg-background text-foreground">
    {mobile && <button className="fixed inset-0 z-30 bg-overlay lg:hidden" onClick={() => setMobile(false)} aria-label="Fechar menu" />}
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200", collapsed ? "w-18" : "w-64", mobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">A</div>{!collapsed && <div><div className="font-semibold tracking-tight">automy</div><div className="text-[10px] text-muted-foreground">OPERATIONS</div></div>}<Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setMobile(false)}><X className="size-4" /></Button></div>
      <nav className="flex-1 space-y-1 p-3">{nav.map((item) => { const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to); const Icon = item.icon; return <Link key={item.to} to={item.to} onClick={() => setMobile(false)} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")} title={collapsed ? item.label : undefined}><Icon className="size-4 shrink-0" />{!collapsed && <span>{item.label}</span>}</Link>; })}</nav>
      <div className="border-t border-sidebar-border p-3"><Button variant="ghost" className="hidden w-full justify-start lg:flex" onClick={() => setCollapsed(!collapsed)}><ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Recolher menu"}</Button></div>
    </aside>
    <div className={cn("min-w-0 transition-[padding] duration-200", collapsed ? "lg:pl-18" : "lg:pl-64")}>
      <header className="sticky top-0 z-20 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)}><Menu className="size-5" /></Button><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-9 w-full rounded-lg bg-muted/70 pl-9 pr-12 text-sm outline-hidden ring-ring/20 placeholder:text-muted-foreground focus:ring-3" placeholder="Pesquisar em tudo..." /><kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">⌘ K</kbd></div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Button variant="ghost" size="icon" className="relative" aria-label="Notificações"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" /></Button><div className="ml-1 flex items-center gap-2 border-l border-border pl-3"><div className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold">MC</div><div className="hidden min-w-0 xl:block"><div className="text-xs font-medium">Marina Costa</div><div className="text-[10px] text-muted-foreground">Administradora</div></div></div></div></header>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
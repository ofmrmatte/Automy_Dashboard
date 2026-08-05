import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  KeyRound,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useIdentity } from "@/features/identity/context/identity-context";
import { NotificationCenter } from "@/features/settings/components/notification-center";
import { APP_DESCRIPTION, APP_NAVIGATION, APP_NAME } from "@/shared/constants/app";
import { Button, Input } from "@/shared/components/ui";
import { toast } from "@/shared/components/toast";
import { cn } from "@/shared/utils/cn";
import { getLocalizedGreeting } from "@/shared/utils/regional-formatters";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { avatarUrl, preferences, profile, signOut, updatePreferences, user } = useIdentity();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const displayName = fullName || user?.email || "Conta";
  const displayRole = profile?.roleName || "";
  const greeting = getLocalizedGreeting(
    profile?.firstName ?? "",
    {
      locale: preferences?.language,
      timeZone: preferences?.timeZone,
      currency: preferences?.currency,
      timeFormat: preferences?.timeFormat,
    },
    profile?.companyTimeZone,
    now,
  );
  const initials = (fullName || user?.email || "A")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    const stored = localStorage.getItem("automy-theme");
    const preference = preferences?.theme ?? stored ?? "system";
    const useDark =
      preference === "system"
        ? matchMedia("(prefers-color-scheme: dark)").matches
        : preference === "dark";

    setDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, [preferences?.theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("automy-theme", next ? "dark" : "light");
    if (preferences) {
      updatePreferences({ ...preferences, theme: next ? "dark" : "light" }).catch((error) => {
        toast.danger(error instanceof Error ? error.message : "Não foi possível salvar o tema.");
      });
    }
  };

  const handleLogout = () => {
    signOut("local").catch((error) => {
      toast.danger(error instanceof Error ? error.message : "Não foi possível sair.");
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobile && (
        <button
          className="fixed inset-0 z-30 bg-overlay lg:hidden"
          onClick={() => setMobile(false)}
          aria-label="Fechar menu"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200",
          collapsed ? "w-18" : "w-64",
          mobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={APP_NAME}>
            <img
              src="/automy-symbol.svg"
              alt=""
              className={cn("size-9 shrink-0 object-contain", !collapsed && "lg:hidden")}
            />
            {!collapsed && (
              <>
                <img
                  src="/automy-logo-horizontal.svg"
                  alt={APP_NAME}
                  className="h-9 w-34 object-contain object-left dark:hidden"
                />
                <img
                  src="/automy-logo-white.svg"
                  alt={APP_NAME}
                  className="hidden h-9 w-34 object-contain object-left dark:block"
                />
              </>
            )}
          </Link>
          {!collapsed && (
            <span className="sr-only">
              {APP_NAME} - {APP_DESCRIPTION}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setMobile(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {APP_NAVIGATION.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobile(false)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="hidden w-full justify-start lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Recolher menu"}
          </Button>
        </div>
      </aside>
      <div
        className={cn(
          "min-w-0 transition-[padding] duration-200",
          collapsed ? "lg:pl-18" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-20 grid h-16 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)}>
            <Menu className="size-5" />
          </Button>
          <Link to="/" className="flex items-center lg:hidden" aria-label={APP_NAME}>
            <img src="/automy-symbol.svg" alt={APP_NAME} className="size-8 object-contain" />
          </Link>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 border-0 bg-muted/70 pl-9 pr-12 ring-ring/20 focus:ring-3"
              placeholder="Pesquisar em tudo..."
            />
            <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
              ⌘ K
            </kbd>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <NotificationCenter />
            <div className="relative ml-1 border-l border-border pl-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1 text-left hover:bg-accent"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Abrir menu do usuário"
              >
                <div className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="size-8 rounded-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden min-w-0 xl:block">
                  <div className="max-w-40 truncate text-xs font-medium">{displayName}</div>
                  <div className="max-w-40 truncate text-[10px] text-muted-foreground">
                    {displayRole || profile?.companyName}
                  </div>
                </div>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 z-50 w-72 rounded-card border border-border bg-card p-2 text-sm shadow-modal">
                  <div className="border-b border-border px-3 py-2">
                    <div className="font-medium text-foreground">{greeting}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {profile?.companyName ?? "Automy"} · {displayRole}
                    </div>
                  </div>
                  <Link
                    to="/configuracoes"
                    className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="size-4" />
                    Perfil
                  </Link>
                  <Link
                    to="/configuracoes"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="size-4" />
                    Configurações
                  </Link>
                  <Link
                    to="/configuracoes"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    <KeyRound className="size-4" />
                    Alterar senha
                  </Link>
                  <Link
                    to="/configuracoes"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Monitor className="size-4" />
                    Sessões
                  </Link>
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center gap-2 rounded-lg border-t border-border px-3 py-2 text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

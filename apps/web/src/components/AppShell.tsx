import { Link } from "@tanstack/react-router";
import { Bell, CloudLightning, Gauge, Menu, Moon, Search, Settings2, Sun } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { SettingsDialog } from "./SettingsDialog";
import { useThemeStore, useSettingsStore } from "../lib/store";

const nav = [
  { to: "/", label: "Live map", icon: Gauge },
  { to: "/events", label: "Events", icon: CloudLightning },
  { to: "/alerts", label: "Alerts", icon: Bell },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const { open: settingsOpen, setOpen: setSettingsOpen } = useSettingsStore();

  const isDark = theme === "dark";

  useEffect(() => {
    // Ensure root class matches store on mount
    if (typeof document !== "undefined") {
      const isDocDark = document.documentElement.classList.contains("dark");
      if (isDocDark && theme !== "dark") {
        setTheme("dark");
      }
    }
  }, [setTheme, theme]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* ── Settings Modal Dialog (AmarJay UI) ───────────── */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* ── Top navbar ───────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-border bg-background/98 px-4 backdrop-blur-sm md:px-6"
        style={{ backdropFilter: "blur(8px)" }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <span
            className="grid size-7 place-items-center rounded-sm bg-foreground text-background transition-transform group-hover:scale-95"
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="9" r="1.5" fill="currentColor" />
              <path d="M4 6.5C4.8 5.6 5.85 5 7 5s2.2.6 3 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M2 4.5C3.3 3 4.98 2 7 2s3.7 1 5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">GeoCast</span>
          <span className="hidden border-l border-border pl-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            India Weather Intelligence
          </span>
        </Link>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1">
          {/* Live indicator */}
          <div className="mr-3 hidden items-center gap-1.5 rounded-lg border border-border bg-accent/30 px-2.5 py-1 lg:flex">
            <span className="size-1.5 rounded-full bg-safe shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-mono text-muted-foreground">Live · 12:03 UTC</span>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle light/dark mode"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-transform hover:bg-accent hover:text-foreground active:scale-[0.96]"
          >
            {isDark ? <Sun className="size-4 stroke-[1.5]" /> : <Moon className="size-4 stroke-[1.5]" />}
          </button>
          <button
            aria-label="Search"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            title="Open GeoCast Settings"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Settings2 className="size-4" />
          </button>
          <button
            aria-label="Menu"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      {/* ── Side nav (desktop) / Bottom nav (mobile) ─────── */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t border-border bg-background md:inset-y-14 md:right-auto md:w-16 md:flex-col md:border-r md:border-t-0">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{
              className:
                "text-foreground bg-accent md:border-l-2 md:border-foreground",
            }}
            inactiveProps={{
              className:
                "text-muted-foreground hover:text-foreground hover:bg-accent",
            }}
            className="group flex flex-1 flex-col items-center justify-center gap-1 transition-colors md:flex-none md:h-16"
            aria-label={label}
          >
            <Icon className="size-4" />
            <span className="text-[9px] font-medium uppercase tracking-wider">
              {label}
            </span>
          </Link>
        ))}

        {/* API status indicator — desktop only */}
        <div className="mt-auto hidden w-full border-t border-border py-3 text-center md:block">
          <div className="mx-auto size-1.5 rounded-full bg-safe" aria-hidden="true" />
          <span className="mt-1 block text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">
            API Status
          </span>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────── */}
      <main className="min-h-screen pt-14 pb-14 md:pl-16 md:pb-0">{children}</main>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, ChevronRight, Radio, ShieldAlert, Zap } from "lucide-react";
import { alerts } from "../lib/weather-data";
import { StatusBadge } from "../components/StatusBadge";
import { ArrowFillButton } from "../components/obsidian/ArrowFillButton";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Live Alerts — GeoCast" },
      { name: "description", content: "Live severe-weather alerts and event navigation for India." },
      { property: "og:title", content: "GeoCast Live Alerts" },
      { property: "og:description", content: "Live severe-weather alerts and event navigation for India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const severe = alerts.filter((a) => a.severity === "severe").length;
  const moderate = alerts.filter((a) => a.severity === "moderate").length;
  const total = alerts.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background noise-texture bg-noise-radial px-6 py-10 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Alert Operations
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-accent/40 px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  Automated Weather Stream
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
                Live Alert Feed
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Automated alarm dispatches and real-time triggers linked to active severe forecast events across India.
              </p>
            </div>

            {/* Stream connected badge */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-accent/30 px-3 py-1.5 text-xs text-muted-foreground font-mono shadow-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-safe/30 bg-safe/10 px-2 py-0.5 text-[11px] font-medium text-safe">
                <span className="size-1.5 rounded-full bg-safe shrink-0" />
                Active
              </span>
              <span>Alert Stream</span>
            </div>
          </div>

          {/* ── Stat Blocks Grid ─────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Stat Box 1 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Dispatches
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{total}</span>
                <span className="text-xs text-muted-foreground">alarms</span>
              </div>
            </div>

            {/* Stat Box 2 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Critical Level
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-critical">{critical}</span>
                <span className="text-xs text-muted-foreground">high priority</span>
              </div>
            </div>

            {/* Stat Box 3 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Severe Warnings
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-severe">{severe}</span>
                <span className="text-xs text-muted-foreground">warnings</span>
              </div>
            </div>

            {/* Stat Box 4 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Dispatch Latency
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-safe">
                <Zap className="size-3.5 text-safe" />
                42 ms · Realtime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Grid: Main Alert Cards + Sidebar Summary ────────── */}
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Alert Cards List ─────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {alerts.map((a) => (
              <Link
                key={a.id}
                to="/events/$id"
                params={{ id: a.eventId }}
                className="group relative block overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/40"
              >
                {/* Left severity indicator strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    a.severity === "critical"
                      ? "bg-critical"
                      : a.severity === "severe"
                      ? "bg-severe"
                      : "bg-warning"
                  }`}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pl-2">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge severity={a.severity} />
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                        {a.id}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Ref: {a.eventId}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {a.message}
                    </h3>

                    <p className="text-xs text-muted-foreground">{a.place}</p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {a.dispatchedAt}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:translate-x-0.5 transition-transform">
                      Inspect Event
                      <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {alerts.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                No active alerts recorded.
              </div>
            )}
          </div>

          {/* ── Sidebar Summary Block ──────────────────────────── */}
          <aside className="flex flex-col gap-4">
            {/* System Status Summary Box */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Bell className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dispatch Distribution
                </h3>
              </div>

              {/* Progress bars distribution */}
              <div className="space-y-3">
                {[
                  {
                    label: "Critical Alarms",
                    count: critical,
                    color: "bg-critical",
                    pct: total > 0 ? (critical / total) * 100 : 0,
                  },
                  {
                    label: "Severe Warnings",
                    count: severe,
                    color: "bg-severe",
                    pct: total > 0 ? (severe / total) * 100 : 0,
                  },
                  {
                    label: "Moderate Alerts",
                    count: moderate,
                    color: "bg-warning",
                    pct: total > 0 ? (moderate / total) * 100 : 0,
                  },
                ].map(({ label, count, color, pct }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold">{count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Last Stream Sync</span>
                <span className="font-mono font-medium text-foreground">12:03 UTC</span>
              </div>
            </div>

            {/* Health Check Block */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Infrastructure Health
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-safe" />
                    Event Stream Pipeline
                  </span>
                  <span className="font-mono text-[10px] text-safe font-semibold">100% UP</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-safe" />
                    Radar Storage Engine
                  </span>
                  <span className="font-mono text-[10px] text-safe font-semibold">OK</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-safe" />
                    Anomaly Alarms
                  </span>
                  <span className="font-mono text-[10px] text-safe font-semibold">ONLINE</span>
                </div>
              </div>

              <div className="pt-2">
                <ArrowFillButton
                  href="/events"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                >
                  View All Events
                </ArrowFillButton>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

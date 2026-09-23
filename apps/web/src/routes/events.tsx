import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { getEvents, type Severity } from "../lib/weather-data";
import { StatusBadge } from "../components/StatusBadge";
import { ArrowFillButton } from "../components/obsidian/ArrowFillButton";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Event Explorer — GeoCast" },
      { name: "description", content: "Search and compare active weather events across India." },
      { property: "og:title", content: "GeoCast Event Explorer" },
      { property: "og:description", content: "Search and compare active weather events across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data = [] } = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const [q, setQ] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  const filtered = data.filter((e) => {
    const matchesSearch = (e.type + e.id).toLowerCase().includes(q.toLowerCase());
    const matchesSeverity = severityFilter === "all" || e.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = data.filter((e) => e.severity === "critical").length;
  const severeCount = data.filter((e) => e.severity === "severe").length;
  const maxProbability = data.length > 0 ? Math.max(...data.map((e) => e.probability)) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Page Header Block (Clean, Editorial with Noise Gradient) ────────────────────── */}
      <div className="border-b border-border bg-background noise-texture bg-noise-radial px-6 py-10 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Operational Archive
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-accent/40 px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              Realtime Radar Feed
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
            Event Explorer
          </h1>

          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Review detected and forecast extreme-weather events across India with high-resolution radar anomaly monitoring.
          </p>

          {/* ── Metric Stat Blocks Grid ─────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Stat Box 1 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total Monitored
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{data.length}</span>
                <span className="text-xs text-muted-foreground">events</span>
              </div>
            </div>

            {/* Stat Box 2 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                High Risk Alarms
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-critical">
                  {criticalCount + severeCount}
                </span>
                <span className="text-xs text-muted-foreground">critical/severe</span>
              </div>
            </div>

            {/* Stat Box 3 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Peak Occurrence P(E)
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">
                  {Math.round(maxProbability * 100)}%
                </span>
                <span className="text-xs text-muted-foreground">max risk</span>
              </div>
            </div>

            {/* Stat Box 4 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Radar Pipeline
              </span>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-safe/30 bg-safe/10 px-2 py-0.5 font-mono text-[11px] font-medium text-safe">
                  <span className="size-1.5 rounded-full bg-safe shrink-0" />
                  Active
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">5km Grid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Severity Filter Controls ─────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-6 md:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search event type, ID, or location..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Severity Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "critical", "severe", "moderate", "minor"] as const).map((sev) => {
              const count = sev === "all" ? data.length : data.filter((e) => e.severity === sev).length;
              const active = severityFilter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  <span>{sev}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono ${
                      active ? "bg-background text-foreground" : "bg-accent text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Events Data Grid / Cards List ─────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 pb-12 md:px-10">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold">No events match filter criteria</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search query or severity filter pills.
            </p>
            <button
              onClick={() => {
                setQ("");
                setSeverityFilter("all");
              }}
              className="mt-4 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((e) => {
              const probPercent = Math.round(e.probability * 100);
              return (
                <div
                  key={e.id}
                  className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-foreground/40"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Event Identifier & Location */}
                    <div className="min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <StatusBadge severity={e.severity} />
                        <span className="font-mono text-[10px] text-muted-foreground">{e.id}</span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold tracking-tight text-foreground">
                        {e.type}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3 text-muted-foreground" />
                        <span>
                          {e.centroid.lat.toFixed(2)}° N, {e.centroid.lon.toFixed(2)}° E
                        </span>
                      </div>
                    </div>

                    {/* Probability Progress Bar & Percentage */}
                    <div className="flex-1 max-w-xs rounded-lg border border-border/60 bg-accent/20 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Occurrence Risk
                        </span>
                        <span className="font-mono font-bold">{probPercent}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-foreground transition-all duration-300"
                          style={{ width: `${probPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Forecast Lead & Valid Time */}
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                          Forecast Lead
                        </span>
                        <span className="font-mono text-sm font-semibold">+{e.leadHours}h</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">
                          Valid Window
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(e.validTime).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          · {new Date(e.validTime).getUTCHours()}:00 UTC
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center justify-end">
                      <ArrowFillButton
                        href={`/events/${e.id}`}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        View Analysis
                      </ArrowFillButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground border-t border-border pt-4">
          <span>
            Showing {filtered.length} of {data.length} active events in operational archive
          </span>
          <Link
            to="/"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium"
          >
            <span>Explore on 3D Live Map</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

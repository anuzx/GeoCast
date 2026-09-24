import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronRight, CloudRain, Layers3, MapPin, Route as RouteIcon, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { WeatherMap } from "../components/WeatherMap";
import { StatusBadge } from "../components/StatusBadge";
import { events, getEvent, metrics, trajectory } from "../lib/weather-data";

export const Route = createFileRoute("/events/$id")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} Analysis — GeoCast` },
      { name: "description", content: "Detailed weather event trajectory, probability, and evaluation metrics." },
      { property: "og:title", content: `${params.id} Analysis — GeoCast` },
      { property: "og:description", content: "Detailed weather event trajectory, probability, and evaluation metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id),
  });

  const [tab, setTab] = useState<"overview" | "evaluation">("overview");
  const [spread, setSpread] = useState(true);

  if (!event) {
    return (
      <div className="grid h-[calc(100vh-3.5rem)] place-items-center text-sm text-muted-foreground">
        Event data unavailable
      </div>
    );
  }

  const probPercent = Math.round(event.probability * 100);

  return (
    <div className="h-[calc(100vh-3.5rem-3.5rem)] overflow-auto md:h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <div className="grid min-h-full xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* ── Left Side: Interactive Weather Map ───────────────────── */}
        <section className="relative min-h-[56vh] xl:min-h-full border-r border-border">
          <WeatherMap events={events} selectedId={event.id} showEnsemble={spread} />

          {/* Floating back button & breadcrumb header */}
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <Link
              to="/events"
              className="grid size-9 place-items-center rounded-md border border-border bg-background/95 shadow-sm hover:bg-accent transition-colors"
              title="Back to events list"
            >
              <ArrowLeft className="size-4 text-foreground" />
            </Link>

            <div className="flex items-center gap-2 rounded-md border border-border bg-background/95 px-3 py-1.5 shadow-sm">
              <span className="font-mono text-xs font-semibold">{event.id}</span>
              <ChevronRight className="size-3 text-muted-foreground" />
              <span className="text-xs font-medium">{event.type}</span>
            </div>
          </div>

          {/* Floating trajectory timeline overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg border border-border bg-background/95 p-3.5 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-3">
              <RouteIcon className="size-4 text-foreground shrink-0" />
              <div className="flex flex-1 items-center">
                {trajectory.map((p, i) => (
                  <div key={p.time} className="flex flex-1 items-center">
                    <button className="group text-left">
                      <span className="block size-2.5 rounded-full bg-foreground ring-4 ring-foreground/15 transition-transform group-hover:scale-125" />
                      <span className="mt-1.5 block font-mono text-[9px] text-muted-foreground">
                        {p.time}
                      </span>
                    </button>
                    {i < trajectory.length - 1 && <span className="mx-2 h-px flex-1 bg-border" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Right Side: 7ovr Analysis Sidebar ────────────────────── */}
        <aside className="bg-background flex flex-col justify-between">
          <div>
            {/* Header section with noise texture */}
            <div className="border-b border-border p-6 space-y-4 noise-texture bg-noise-radial">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge severity={event.severity} />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    MODEL SETD-V1
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                  Radar Sector
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">{event.type}</h1>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3 text-muted-foreground" />
                  India Sector · Valid 21 Sep 2026, 12:00 UTC
                </p>
              </div>

              {/* ── 7ovr Stat Metric Boxes ───────────────────────────── */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="rounded-md border border-border bg-accent/30 p-3 text-center">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Probability
                  </span>
                  <span className="mt-1 text-xl font-bold font-mono">{probPercent}%</span>
                </div>

                <div className="rounded-md border border-border bg-accent/30 p-3 text-center">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Peak Value
                  </span>
                  <span className="mt-1 text-xl font-bold font-mono">248</span>
                  <span className="text-[9px] text-muted-foreground block">mm / 6h</span>
                </div>

                <div className="rounded-md border border-border bg-accent/30 p-3 text-center">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">
                    Resolution
                  </span>
                  <span className="mt-1 text-xl font-bold font-mono">5 km</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border bg-accent/10">
              {(["overview", "evaluation"] as const).map((x) => (
                <button
                  key={x}
                  onClick={() => setTab(x)}
                  className={`h-11 flex-1 border-b-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    tab === x
                      ? "border-foreground text-foreground font-semibold bg-background"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {x}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "overview" ? (
              <div className="flex flex-col gap-6 p-6">
                {/* Probability trend section */}
                <section className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Probability Progression
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      Max {probPercent}%
                    </span>
                  </div>

                  {/* Probability Chart Bar */}
                  <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
                    <div className="flex h-24 items-end gap-3 border-b border-border pb-2">
                      {trajectory.map((p) => (
                        <div
                          key={p.time}
                          className="flex flex-1 flex-col items-center justify-end gap-1 h-full"
                        >
                          <span className="font-mono text-[9px] font-bold text-foreground">
                            {Math.round(p.probability * 100)}%
                          </span>
                          <div
                            className="w-full rounded-t bg-foreground transition-all duration-300"
                            style={{ height: `${p.probability * 70}%` }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
                      {trajectory.map((p) => (
                        <span key={p.time}>{p.time.split(", ")[1]}</span>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Downscaled Precipitation Block */}
                <section className="rounded-lg border border-border bg-background p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <CloudRain className="size-4 text-foreground" />
                    <div>
                      <p className="text-xs font-semibold">Downscaled Precipitation Field</p>
                      <p className="text-[10px] text-muted-foreground">p50 · 5 km grid · 21 Sep 12:00</p>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 via-teal-400 to-amber-500" />

                  <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
                    <span>0 mm</span>
                    <span>250 mm/6h</span>
                  </div>
                </section>

                {/* Ensemble toggle & Compare Action */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer rounded-lg border border-border p-3">
                    <span>Show Ensemble Spread Footprint</span>
                    <input
                      type="checkbox"
                      checked={spread}
                      onChange={(e) => setSpread(e.target.checked)}
                      className="accent-foreground size-4"
                    />
                  </label>

                  <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-xs font-semibold text-background transition-colors hover:bg-foreground/90">
                    <Layers3 className="size-4" />
                    Compare Forecast Layers
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 rounded-lg border border-safe/30 bg-safe/10 p-3 text-safe">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span className="text-xs font-medium">Physics verification checks passed cleanly</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(metrics).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-border bg-background p-3.5 shadow-sm space-y-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        {k}
                      </span>
                      <span className="font-mono text-lg font-bold block">{v}</span>
                      <span className="text-[9px] text-muted-foreground block">Measured score</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] leading-relaxed text-muted-foreground border-t border-border pt-3">
                  Evaluation metrics calculated using ground-truth radar observations. Model run ID: 20 Sep 2026, 12:03 UTC.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

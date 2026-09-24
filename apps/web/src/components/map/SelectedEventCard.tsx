import { ArrowRight, Crosshair, MapPin, X } from "lucide-react";
import type { WeatherEvent } from "../../lib/weather-data";
import { TRAJECTORY, leadLabel } from "../../lib/map-data";
import { StatusBadge } from "../StatusBadge";

interface SelectedEventCardProps {
  event: WeatherEvent;
  lead: number;
  showEnsemble: boolean;
  onToggleEnsemble: () => void;
  onFocus: () => void;
  onClose: () => void;
  onOpen: () => void;
}

/** Floating selected-event card positioned bottom-right */
export function SelectedEventCard({
  event,
  lead,
  showEnsemble,
  onToggleEnsemble,
  onFocus,
  onClose,
  onOpen,
}: SelectedEventCardProps) {
  const point = TRAJECTORY.reduce(
    (b, p) => (Math.abs(p.lead - lead) < Math.abs(b.lead - lead) ? p : b),
    TRAJECTORY[0]
  );

  const probPercent = Math.round(point.probability * 100);

  return (
    <section className="absolute bottom-[4.75rem] right-3 z-20 w-[calc(100%-1.5rem)] rounded-xl border border-border bg-background/95 text-foreground backdrop-blur-md shadow-lg dark:border-white/10 dark:bg-[oklch(0.13_0.005_270/0.95)] dark:text-white sm:w-84 md:bottom-24 overflow-hidden noise-texture">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b border-border/60 p-4 pb-3 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge severity={event.severity} />
            <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
              {event.id}
            </span>
          </div>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground dark:text-white">
            {event.type}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close event card"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-transform hover:bg-accent hover:text-foreground active:scale-[0.96]"
        >
          <X className="size-4 stroke-[2]" />
        </button>
      </div>

      {/* ── Probability & Severity Metrics Grid ───────────────────── */}
      <div className="p-4 flex flex-col gap-3">
        {/* Probability Progress Banner */}
        <div className="rounded-lg border border-border/60 bg-accent/40 p-2.5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Occurrence Probability</span>
            <span className="font-mono tabular-nums font-bold text-foreground dark:text-white">
              {probPercent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300 dark:bg-white"
              style={{ width: `${probPercent}%` }}
            />
          </div>
        </div>

        {/* 2-Column Stat Boxes */}
        <div className="grid grid-cols-2 gap-2">
          {/* Intensity Box */}
          <div className="rounded-lg border border-border/60 bg-background p-2.5 dark:border-white/10 dark:bg-white/5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Peak Intensity
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold tabular-nums tracking-tight text-foreground dark:text-white">
                {Math.round(point.intensity)}
              </span>
              <span className="text-[10px] text-muted-foreground">{event.peak.unit}</span>
            </div>
          </div>

          {/* Lead Box */}
          <div className="rounded-lg border border-border/60 bg-background p-2.5 dark:border-white/10 dark:bg-white/5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Forecast Lead
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono tabular-nums tracking-tight text-foreground dark:text-white">
                {leadLabel(lead)}
              </span>
            </div>
          </div>
        </div>

        {/* Coordinates bar */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
            <MapPin className="size-3 text-muted-foreground stroke-[1.5]" />
            {event.centroid.lat.toFixed(2)}° N, {event.centroid.lon.toFixed(2)}° E
          </span>
          <span className="font-mono text-[9px] uppercase">India Sector</span>
        </div>
      </div>

      {/* ── Actions Footer ────────────────────────────────────────── */}
      <div className="border-t border-border/60 bg-accent/20 p-3 dark:border-white/10 dark:bg-white/5 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={onToggleEnsemble}
            className={`h-9 flex-1 rounded-md border text-xs font-medium transition-transform active:scale-[0.96] ${
              showEnsemble
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {showEnsemble ? "Hide Ensemble" : "Show Ensemble"}
          </button>

          <button
            onClick={onFocus}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground transition-transform hover:border-foreground hover:text-foreground active:scale-[0.96]"
          >
            <Crosshair className="size-3.5 stroke-[1.5]" />
            Focus Map
          </button>
        </div>

        <button
          onClick={onOpen}
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-foreground text-xs font-semibold text-background transition-transform hover:bg-foreground/90 active:scale-[0.96]"
        >
          Open Event Analysis
          <ArrowRight className="size-3.5 stroke-[2]" />
        </button>
      </div>
    </section>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { WeatherMap, type HoverInfo } from "../WeatherMap";
import { MapControls } from "./MapControls";
import { ForecastTimeline } from "./ForecastTimeline";
import { WeatherLegend } from "./WeatherLegend";
import { SelectedEventCard } from "./SelectedEventCard";
import { defaultMapState, type MapState } from "./types";
import { fieldsAvailable } from "../../lib/map-data";
import { getEvents } from "../../lib/weather-data";

type HoverObject = {
  typeLabel?: string;
  probability?: number;
  leadHours?: number;
  id?: string;
};

const ALL_VARIABLES = [
  "precipitation",
  "wind_speed",
  "temperature",
  "pressure",
  "humidity",
] as const;

/**
 * WeatherMapSection — the clean self-contained map experience.
 *
 * Responsibilities:
 *  - Own the MapState (variable, lead, percentile, layer toggles, selection).
 *  - Render the core WeatherMap plus top controls, timeline, legend, and event card.
 *  - Manage hover tooltip state.
 *  - Navigate to event detail on "Open".
 */
export function WeatherMapSection() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: getEvents,
  });

  const [mapState, setMapState] = useState<MapState>({
    ...defaultMapState,
    // Pre-select first event for demo purposes
    selectedEventId: "EVT-1021",
  });
  const [hover, setHover] = useState<HoverInfo>(null);

  const selectedEvent = events.find((e) => e.id === mapState.selectedEventId) ?? null;
  const available = fieldsAvailable(selectedEvent);

  // When a different event is selected, reset to its first available variable
  // if the current one is not supported by the new event.
  useEffect(() => {
    if (selectedEvent && !available.includes(mapState.variable)) {
      setMapState((s) => ({ ...s, variable: available[0] ?? "precipitation" }));
    }
  }, [selectedEvent?.id, available, mapState.variable]);

  const patchState = useCallback((patch: Partial<MapState>) => {
    setMapState((s) => ({ ...s, ...patch }));
  }, []);

  const hoverObj = hover?.object as HoverObject | undefined;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── Core map with moving graph / trajectory / raster ──────────── */}
      <WeatherMap
        events={events}
        mapState={mapState}
        onSelect={(id) => patchState({ selectedEventId: id })}
        onHover={setHover}
      />

      {/* ── Top-centre controls ───────────────────────────────────────── */}
      <MapControls
        state={mapState}
        available={
          selectedEvent
            ? available
            : (ALL_VARIABLES as unknown as typeof available)
        }
        onChange={patchState}
      />

      {/* ── Weather legend (bottom-left, above timeline) ──────────────── */}
      {selectedEvent && mapState.showField && (
        <WeatherLegend variable={mapState.variable} lead={mapState.lead} />
      )}

      {/* ── Selected-event card (bottom-right, above timeline) ───────── */}
      {selectedEvent && (
        <SelectedEventCard
          event={selectedEvent}
          lead={mapState.lead}
          showEnsemble={mapState.showEnsemble}
          onToggleEnsemble={() =>
            patchState({ showEnsemble: !mapState.showEnsemble })
          }
          onFocus={() => {
            // Re-assign the same ID to re-trigger the fly-to effect in WeatherMap
            patchState({ selectedEventId: null });
            setTimeout(
              () => patchState({ selectedEventId: mapState.selectedEventId }),
              50
            );
          }}
          onClose={() => patchState({ selectedEventId: null })}
          onOpen={() =>
            navigate({
              to: "/events/$id",
              params: { id: selectedEvent.id },
            })
          }
        />
      )}

      {/* ── Forecast timeline with play/pause moving graph timelapse ── */}
      <ForecastTimeline
        lead={mapState.lead}
        onChange={(lead) => patchState({ lead })}
      />

      {/* ── Hover tooltip ─────────────────────────────────────────────── */}
      {hover && hoverObj && (
        <div
          className="pointer-events-none absolute z-30 border border-border bg-background/95 text-foreground px-2.5 py-2 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[oklch(0.13_0.005_270/0.95)] dark:text-white"
          style={{ left: hover.x + 14, top: hover.y - 64 }}
          aria-hidden
        >
          <p className="text-xs font-medium text-foreground dark:text-white">
            {hoverObj.typeLabel ?? "Weather event"}
          </p>
          {hoverObj.probability !== undefined && (
            <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-white/50">
              P(event):{" "}
              <span className="font-semibold text-foreground dark:text-white">
                {Math.round(hoverObj.probability * 100)}%
              </span>
            </p>
          )}
          {hoverObj.leadHours !== undefined && (
            <p className="text-[10px] text-muted-foreground dark:text-white/50">
              Lead: T+{hoverObj.leadHours}h
            </p>
          )}
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="pointer-events-none absolute right-4 top-16 z-30 flex items-center gap-2 border border-border bg-background/95 text-foreground px-3 py-2 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[oklch(0.13_0.005_270/0.95)] dark:text-white">
          <span className="size-1.5 rounded-full bg-foreground/60 dark:bg-white/60 shrink-0" />
          <span className="text-[10px] text-muted-foreground dark:text-white/50">Loading events…</span>
        </div>
      )}

      {/* ── Empty state (no events) ────────────────────────────────────── */}
      {!isLoading && events.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="border border-border bg-panel/95 px-8 py-6 text-center backdrop-blur">
            <p className="text-sm text-foreground">
              No significant events detected
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              for the selected forecast window
            </p>
            <button
              className="pointer-events-auto mt-4 border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMapState(defaultMapState)}
            >
              Reset filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

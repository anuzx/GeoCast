import { useState } from "react";
import { Box, ChevronDown, Layers3 } from "lucide-react";
import { VARIABLES, type Percentile, type VariableId } from "../../lib/map-data";
import type { MapState } from "./types";

const LAYER_TOGGLES: {
  key: keyof Pick<
    MapState,
    | "showTerrain"
    | "showField"
    | "showEvents"
    | "showTrajectory"
    | "showEnsemble"
    | "showWind"
    | "showBoundaries"
  >;
  label: string;
}[] = [
  { key: "showTerrain", label: "Terrain" },
  { key: "showField", label: "5 km field" },
  { key: "showEvents", label: "Event footprints" },
  { key: "showTrajectory", label: "Trajectory" },
  { key: "showEnsemble", label: "Ensemble spread" },
  { key: "showWind", label: "Wind vectors" },
  { key: "showBoundaries", label: "State boundaries" },
];

/** Shared class for floating map UI panels — theme aware (light mode: white card, dark mode: dark glass) */
const mapPanel =
  "border border-border bg-background/95 text-foreground backdrop-blur shadow-sm dark:border-white/10 dark:bg-[oklch(0.15_0.005_270/0.92)] dark:text-[oklch(0.95_0_0)]";

export function MapControls({
  state,
  available,
  onChange,
}: {
  state: MapState;
  available: VariableId[];
  onChange: (patch: Partial<MapState>) => void;
}) {
  const [layersOpen, setLayersOpen] = useState(false);
  const [varOpen, setVarOpen] = useState(false);
  const [pctOpen, setPctOpen] = useState(false);
  const closeAll = () => {
    setLayersOpen(false);
    setVarOpen(false);
    setPctOpen(false);
  };

  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-stretch gap-1.5">
      {/* Variable selector */}
      <div className="relative">
        <button
          onClick={() => {
            closeAll();
            setVarOpen(!varOpen);
          }}
          className={`flex h-9 items-center gap-2 rounded-md px-3 transition-transform active:scale-[0.96] ${mapPanel}`}
        >
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Variable
          </span>
          <span className="text-xs font-medium">{VARIABLES[state.variable].label}</span>
          <ChevronDown className="size-3 text-muted-foreground stroke-[2]" />
        </button>
        {varOpen && (
          <div className={`absolute left-0 top-10.5 w-44 rounded-lg p-1 ${mapPanel}`}>
            {available.map((v) => (
              <button
                key={v}
                onClick={() => {
                  onChange({ variable: v });
                  setVarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent active:scale-[0.98] ${
                  v === state.variable ? "font-semibold text-foreground bg-accent/50" : "text-muted-foreground"
                }`}
              >
                {VARIABLES[v].label}
                <span className="font-mono tabular-nums text-[9px] text-muted-foreground">{VARIABLES[v].unit}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Percentile */}
      <div className="relative">
        <button
          onClick={() => {
            closeAll();
            setPctOpen(!pctOpen);
          }}
          className={`flex h-9 items-center gap-1.5 rounded-md px-3 font-mono tabular-nums text-xs uppercase transition-transform active:scale-[0.96] ${mapPanel}`}
        >
          {state.percentile}
          <ChevronDown className="size-3 text-muted-foreground stroke-[2]" />
        </button>
        {pctOpen && (
          <div className={`absolute left-0 top-10.5 w-28 rounded-lg p-1 ${mapPanel}`}>
            {(["p10", "p50", "p90", "mean"] as Percentile[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  onChange({ percentile: p });
                  setPctOpen(false);
                }}
                className={`block w-full rounded-md px-2.5 py-1.5 text-left font-mono tabular-nums text-xs uppercase transition-colors hover:bg-accent active:scale-[0.98] ${
                  p === state.percentile ? "font-semibold text-foreground bg-accent/50" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layers panel */}
      <div className="relative">
        <button
          onClick={() => {
            closeAll();
            setLayersOpen(!layersOpen);
          }}
          className={`flex h-9 items-center gap-2 rounded-md px-3 text-xs transition-transform active:scale-[0.96] ${mapPanel} ${
            layersOpen ? "!bg-foreground !text-background" : ""
          }`}
        >
          <Layers3 className="size-3.5 stroke-[2]" />
          <span className="hidden sm:inline font-medium">Layers</span>
        </button>
        {layersOpen && (
          <div className={`absolute right-0 top-10.5 w-48 rounded-lg p-3 ${mapPanel}`}>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Layers
            </p>
            {LAYER_TOGGLES.map(({ key, label }) => (
              <label
                key={key}
                className="mt-2.5 flex cursor-pointer items-center justify-between text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(state[key])}
                  onChange={(e) => onChange({ [key]: e.target.checked })}
                  className="accent-foreground h-4 w-4 cursor-pointer"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 3D toggle */}
      <button
        onClick={() => onChange({ view3d: !state.view3d })}
        className={`flex h-9 items-center gap-1.5 rounded-md px-3 font-mono text-xs transition-transform active:scale-[0.96] ${mapPanel} ${
          state.view3d
            ? "!bg-foreground !text-background font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title={state.view3d ? "Switch to 2D view" : "Switch to 3D view"}
        aria-pressed={state.view3d}
      >
        <Box className="size-3.5 stroke-[2]" />
        3D
      </button>
    </div>
  );
}

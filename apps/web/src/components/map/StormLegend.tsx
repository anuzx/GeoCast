import React from "react";
import { WEATHER_VARIABLES, type VariableId } from "../../lib/storm-data";

interface Props {
  selectedVariable: VariableId;
}

export function StormLegend({ selectedVariable }: Props) {
  const meta = WEATHER_VARIABLES[selectedVariable];

  return (
    <div className="pointer-events-none absolute bottom-20 right-3 z-30 hidden sm:flex flex-col gap-2">
      <div className="pointer-events-auto storm-glass-panel p-3 w-60 shadow-2xl space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
            {meta.label} ({meta.unit})
          </span>
          <span className="text-[9px] font-mono text-teal-300">GEO-GRID</span>
        </div>

        {/* Color Gradient Scale */}
        <div className="space-y-1">
          <div
            className="h-2.5 w-full rounded-sm"
            style={{
              background: `linear-gradient(to right, ${meta.colorRamp
                .map((r) => `${r.color} ${r.stop * 100}%`)
                .join(", ")})`,
            }}
          />
          <div className="flex justify-between text-[9px] font-mono text-white/60">
            {meta.steps.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>

        {/* Storm Symbol Reference Guide */}
        <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px] text-white/80">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-teal-300" />
            </span>
            <span>Storm Center</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-0.5 w-3 bg-teal-400 rounded-full" />
            <span>Forecast Track</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded bg-cyan-400/25 border border-cyan-400/60" />
            <span>Uncertainty Cone</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded bg-red-500/30 border border-red-500/80" />
            <span>High-Risk Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}

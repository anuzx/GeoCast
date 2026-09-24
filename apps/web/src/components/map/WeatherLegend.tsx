import { VARIABLES, leadLabel, validTimeLabel, type VariableId } from "../../lib/map-data";

const GRADIENTS: Record<VariableId, string> = {
  precipitation: "linear-gradient(90deg,#0e2a60,#2478c8,#2dc8aa,#facc3c,#eb463c)",
  wind_speed: "linear-gradient(90deg,#143c50,#3caabe,#dc82dc)",
  temperature: "linear-gradient(90deg,#285ac8,#fad25a,#e63c32)",
  pressure: "linear-gradient(90deg,#5a3ca0,#966ed2,#d2c8f0)",
  humidity: "linear-gradient(90deg,#1e3246,#3c82be,#8cd2eb)",
};

/** Legend generated from the field metadata (variable, unit, thresholds, valid time). */
export function WeatherLegend({ variable, lead }: { variable: VariableId; lead: number }) {
  const meta = VARIABLES[variable];
  const steps = meta.steps;
  return (
    <div className="absolute bottom-[4.75rem] left-3 z-10 w-40 border border-border bg-background/95 text-foreground p-3 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[oklch(0.13_0.005_270/0.92)] dark:text-[oklch(0.95_0_0)] md:bottom-24">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{meta.label} · {meta.unit}</p>
      <p className="mt-0.5 text-[9px] text-muted-foreground/70">{leadLabel(lead)} · {validTimeLabel(lead)}</p>
      <div className="mt-2 flex gap-2">
        <div className="h-28 w-2.5" style={{ background: GRADIENTS[variable], transform: "scaleY(-1)" }} />
        <div className="flex h-28 flex-col justify-between font-mono text-[8px] text-muted-foreground">
          {[...steps].reverse().map((s) => <span key={s}>{s}{s === steps[steps.length - 1] ? "+" : ""}</span>)}
        </div>
      </div>
    </div>
  );
}

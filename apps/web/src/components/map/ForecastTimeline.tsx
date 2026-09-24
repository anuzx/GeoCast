import { useEffect, useState } from "react";
import { Clock3, Pause, Play } from "lucide-react";
import { LEAD_STEPS, leadLabel, validTimeLabel } from "../../lib/map-data";

export function ForecastTimeline({ lead, onChange }: { lead: number; onChange: (lead: number) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const nearest = LEAD_STEPS.reduce((b, s) => (Math.abs(s - lead) < Math.abs(b - lead) ? s : b), 0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const currentIndex = LEAD_STEPS.indexOf(nearest);
      const nextIndex = (currentIndex + 1) % LEAD_STEPS.length;
      onChange(LEAD_STEPS[nextIndex]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, nearest, onChange]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 text-foreground px-4 pb-2.5 pt-3 backdrop-blur shadow-sm dark:border-white/10 dark:bg-[oklch(0.13_0.005_270/0.95)] dark:text-[oklch(0.95_0_0)]">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button for Forecast Timelapse */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause forecast timelapse" : "Play forecast timelapse"}
          title={isPlaying ? "Pause timelapse" : "Play forecast timelapse"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-xs transition-transform hover:bg-accent active:scale-[0.96] dark:border-white/10"
        >
          {isPlaying ? (
            <Pause className="size-4 text-foreground stroke-[2]" />
          ) : (
            <Play className="size-4 ml-0.5 text-foreground stroke-[2]" />
          )}
        </button>

        <Clock3 className="size-4 shrink-0 text-muted-foreground stroke-[1.5]" />

        <div className="relative min-w-0 flex-1">
          <input
            aria-label="Forecast time"
            type="range"
            min={0}
            max={120}
            step={24}
            value={lead}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-foreground cursor-pointer"
          />
          <div className="mt-1 flex justify-between">
            {LEAD_STEPS.map((s) => (
              <button
                key={s}
                onClick={() => onChange(s)}
                className={`relative font-mono tabular-nums text-[10px] transition-colors active:scale-[0.96] after:absolute after:-inset-2 ${
                  s === nearest ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {leadLabel(s)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-36 shrink-0 text-right">
          <span className="font-mono tabular-nums text-xs font-medium text-foreground">{leadLabel(lead)}</span>
          <span className="block text-[9px] text-muted-foreground">Valid {validTimeLabel(lead)}</span>
        </div>
      </div>
    </div>
  );
}


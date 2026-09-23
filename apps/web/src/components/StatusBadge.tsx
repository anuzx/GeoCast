import type { Severity } from "../lib/weather-data";
import { cn } from "../lib/utils";

interface StatusBadgeProps {
  severity: Severity;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ severity, className, showDot = false }: StatusBadgeProps) {
  const isCritical = severity === "critical";
  const isSevere = severity === "severe";
  const isModerate = severity === "moderate";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all",
        isCritical && "border-critical/35 bg-critical/12 text-critical",
        isSevere && "border-severe/35 bg-severe/12 text-severe",
        isModerate && "border-warning/35 bg-warning/12 text-warning",
        !isCritical && !isSevere && !isModerate && "border-info/35 bg-info/12 text-info",
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "size-1.5 rounded-full shrink-0",
            isCritical && "bg-critical",
            isSevere && "bg-severe",
            isModerate && "bg-warning",
            !isCritical && !isSevere && !isModerate && "bg-info"
          )}
          aria-hidden="true"
        />
      )}
      {severity}
    </span>
  );
}

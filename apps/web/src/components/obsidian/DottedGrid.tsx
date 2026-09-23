import { useEffect, useRef } from "react";

interface DottedGridProps {
  /** Dot color — defaults to current text color at low opacity */
  dotColor?: string;
  /** Dot size in px — default 1.5 */
  dotSize?: number;
  /** Gap between dots in px — default 20 */
  gap?: number;
  /** Radial fade intensity — 0 to 1, default 0.85 */
  fadeStrength?: number;
  className?: string;
}

/**
 * ObsidianUI — Dotted Grid background component.
 * Canvas-based animated dot grid with a radial gradient fade from center.
 * Copy-adapted from https://www.obsidianui.dev/docs/dotted-grid
 */
export function DottedGrid({
  dotColor = "currentColor",
  dotSize = 1.5,
  gap = 22,
  fadeStrength = 0.9,
  className = "",
}: DottedGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;



    function draw() {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.hypot(cx, cy);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const y = r * gap;
          const dist = Math.hypot(x - cx, y - cy);
          const alpha = (1 - (dist / maxDist) * fadeStrength) * 0.35;
          if (alpha <= 0) continue;

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle =
            dotColor === "currentColor"
              ? `rgba(0,0,0,${alpha})`
              : dotColor;
          ctx.fill();
        }
      }
    }

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      ro.disconnect();
    };
  }, [dotColor, dotSize, gap, fadeStrength]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ animation: "dotted-grid-fade-in 0.8s ease forwards" }}
    />
  );
}

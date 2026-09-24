import { useEffect, useRef, useState } from "react";

interface TextFillAnimationProps {
  /** Text to animate */
  text: string;
  /** Duration in ms — default 800 */
  duration?: number;
  /** Delay before starting in ms — default 100 */
  delay?: number;
  /** Trigger mode — "mount" or "inview" */
  trigger?: "mount" | "inview";
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

/**
 * ObsidianUI — Text Fill Animation.
 * Text that reveals by filling from transparent to solid color.
 * Copy-adapted from https://www.obsidianui.dev/docs/text-fill-animation
 */
export function TextFillAnimation({
  text,
  duration = 900,
  delay = 100,
  trigger = "inview",
  className = "",
  as: Tag = "h1",
}: TextFillAnimationProps) {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(trigger === "mount");

  /* Intersection Observer for inview trigger */
  useEffect(() => {
    if (trigger !== "inview") return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger]);

  /* Animation loop once started */
  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    let raf: number;

    const delayTimer = setTimeout(() => {
      function step(ts: number) {
        if (start === null) start = ts;
        const elapsed = ts - start;
        setProgress(Math.min(elapsed / duration, 1));
        if (elapsed < duration) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [started, duration, delay]);

  const words = text.split(" ");
  const total = words.length;

  return (
    <Tag ref={ref as React.RefObject<never>} className={className} aria-label={text}>
      {words.map((word, i) => {
        const wordStart = i / total;
        const wordEnd = (i + 1) / total;
        const wordProgress = Math.max(
          0,
          Math.min(1, (progress - wordStart) / (wordEnd - wordStart))
        );
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              color: `oklch(0.09 0.005 270 / ${wordProgress})`,
              transition: "color 0.05s",
              willChange: "color",
            }}
            aria-hidden="true"
          >
            {word}
          </span>
        );
      })}
    </Tag>
  );
}

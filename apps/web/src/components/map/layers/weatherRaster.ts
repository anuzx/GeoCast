import { BitmapLayer } from "@deck.gl/layers";
import type { WeatherEvent } from "../../../lib/weather-data";
import {
  makeFieldImage,
  movingFieldBounds,
  interpolateStormCenter,
  type Percentile,
  type VariableId,
} from "../../../lib/map-data";

/** Cache rendered canvases by key — avoids rebuilding the 128×128 field image every animation frame. */
const imageCache = new Map<string, HTMLCanvasElement>();
const CACHE_MAX = 24;
function getCachedImage(
  event: WeatherEvent,
  variable: VariableId,
  lead: number,
  percentile: Percentile,
  key: string
): HTMLCanvasElement {
  if (!imageCache.has(key)) {
    if (imageCache.size >= CACHE_MAX) {
      imageCache.delete(imageCache.keys().next().value!);
    }
    imageCache.set(key, makeFieldImage(event, variable, lead, percentile));
  }
  return imageCache.get(key)!;
}

/**
 * Weather raster that MOVES with the cyclone trajectory.
 * Bounds are recomputed from the interpolated storm position at `lead`,
 * so the field blob travels from sea to land during playback.
 */
export function weatherRasterLayer(
  event: WeatherEvent,
  variable: VariableId,
  lead: number,
  percentile: Percentile,
  opacity: number,
  key: string
) {
  const image = getCachedImage(event, variable, lead, percentile, key);
  // Moving bounds: follows the trajectory point, not the static event bbox
  const [w, s, e, n] = movingFieldBounds(lead);
  return new BitmapLayer({
    id: `field-${key}`,
    image,
    bounds: [w, s, e, n],
    opacity,
    textureParameters: { minFilter: "linear", magFilter: "linear" },
    transitions: { opacity: 200 },
  });
}

/** Soft glowing core rendered at the MOVING storm centre position at this lead. */
export function activeCoreLayer(_event: WeatherEvent, lead: number) {
  const center = interpolateStormCenter(lead);
  return new BitmapLayer({
    id: "active-core",
    image: makeCoreGlow(),
    bounds: [
      center.lon - 0.8,
      center.lat - 0.8,
      center.lon + 0.8,
      center.lat + 0.8,
    ],
    opacity: 0.6,
  });
}

let coreGlow: HTMLCanvasElement | null = null;
function makeCoreGlow() {
  if (coreGlow) return coreGlow;
  const N = 96;
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(N / 2, N / 2, 2, N / 2, N / 2, N / 2);
  g.addColorStop(0, "rgba(255,120,80,0.95)");
  g.addColorStop(0.35, "rgba(255,90,70,0.45)");
  g.addColorStop(1, "rgba(255,90,70,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, N, N);
  coreGlow = c;
  return c;
}

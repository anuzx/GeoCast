import type { WeatherEvent } from "./weather-data";

export type VariableId = "precipitation" | "wind_speed" | "temperature" | "pressure" | "humidity";
export type Percentile = "p10" | "p50" | "p90" | "mean";

export const VARIABLES: Record<VariableId, { label: string; unit: string; steps: number[] }> = {
  precipitation: { label: "Precipitation", unit: "mm/6h", steps: [0, 10, 25, 50, 100, 150, 200, 250] },
  wind_speed: { label: "Wind speed", unit: "km/h", steps: [0, 20, 40, 60, 80, 100, 130] },
  temperature: { label: "Temperature", unit: "°C", steps: [-5, 10, 20, 30, 40, 45, 50] },
  pressure: { label: "Pressure", unit: "hPa", steps: [960, 975, 990, 1000, 1010, 1020] },
  humidity: { label: "Humidity", unit: "%", steps: [10, 30, 50, 70, 85, 95] },
};

export const EVENT_FIELDS: Record<string, VariableId[]> = {
  "EVT-1021": ["precipitation", "wind_speed", "pressure", "humidity"],
  "EVT-1034": ["wind_speed", "precipitation", "pressure"],
  "EVT-1042": ["temperature", "humidity"],
  "EVT-1055": ["precipitation", "humidity", "wind_speed"],
  "EVT-1061": ["temperature", "pressure"],
};
export const fieldsAvailable = (event: WeatherEvent | null | undefined): VariableId[] =>
  (event && EVENT_FIELDS[event.id]) ?? ["precipitation"];

export const LEAD_STEPS = [0, 24, 48, 72, 96, 120];

/** Interpolate storm center at any lead between trajectory waypoints */
export function interpolateStormCenter(lead: number): { lat: number; lon: number; intensity: number; probability: number; phase: string } {
  const sorted = [...TRAJECTORY].sort((a, b) => a.lead - b.lead);
  if (lead <= sorted[0].lead) return sorted[0];
  if (lead >= sorted[sorted.length - 1].lead) return sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const p0 = sorted[i], p1 = sorted[i + 1];
    if (lead >= p0.lead && lead <= p1.lead) {
      const t = (lead - p0.lead) / (p1.lead - p0.lead);
      return {
        lat: p0.lat + (p1.lat - p0.lat) * t,
        lon: p0.lon + (p1.lon - p0.lon) * t,
        intensity: p0.intensity + (p1.intensity - p0.intensity) * t,
        probability: p0.probability + (p1.probability - p0.probability) * t,
        phase: t < 0.5 ? p0.phase : p1.phase,
      };
    }
  }
  return sorted[0];
}
export const leadLabel = (lead: number) => `T+${lead}h`;
export const BASE_TIME = new Date("2026-09-18T12:00:00Z").getTime();
export const validTimeLabel = (lead: number) =>
  new Date(BASE_TIME + lead * 3600_000).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

// Trajectory: Bay of Bengal (sea) → Odisha coast landfall → inland decay
// Lead 0 = storm out at sea near Sri Lanka | Lead 96 = landfall | Lead 120 = inland decay
export const TRAJECTORY = [
  { lead: 0,   lat: 10.2, lon: 84.6, intensity: 68,  probability: 0.55, phase: "sea" },
  { lead: 24,  lat: 12.8, lon: 85.2, intensity: 115, probability: 0.68, phase: "sea" },
  { lead: 48,  lat: 15.4, lon: 85.8, intensity: 172, probability: 0.79, phase: "sea" },
  { lead: 72,  lat: 17.9, lon: 85.5, intensity: 228, probability: 0.87, phase: "sea" },
  { lead: 96,  lat: 19.8, lon: 85.8, intensity: 248, probability: 0.91, phase: "landfall" },
  { lead: 120, lat: 21.4, lon: 85.3, intensity: 134, probability: 0.76, phase: "inland" },
] as const;

export const ENSEMBLE_SUMMARY = {
  p10: [[85.8, 22.8], [86.5, 23.3], [87.1, 23.7], [88.0, 24.3]] as [number, number][],
  p50: [[85.9, 22.9], [86.7, 23.3], [87.4, 23.8], [88.3, 24.6]] as [number, number][],
  p90: [[86.0, 23.0], [86.9, 23.5], [87.7, 24.1], [88.8, 25.0]] as [number, number][],
};

export const ENSEMBLE_MEMBERS: [number, number][][] = [
  [[85.7, 22.6], [86.4, 23.1], [87.2, 23.5], [87.9, 24.0]],
  [[85.9, 23.1], [86.9, 23.6], [87.8, 24.2], [88.9, 25.1]],
  [[85.8, 22.9], [86.6, 23.4], [87.4, 23.9], [88.4, 24.7]],
  [[86.1, 22.7], [87.0, 23.2], [87.6, 23.6], [88.1, 24.1]],
];

const pctFactor = (p: Percentile) => (p === "p10" ? 0.65 : p === "p90" ? 1.3 : p === "mean" ? 0.85 : 1);

const PALETTES: Record<VariableId, [number, [number, number, number]][]> = {
  precipitation: [[0, [14, 42, 96]], [0.25, [36, 120, 200]], [0.5, [45, 200, 170]], [0.75, [250, 204, 60]], [1, [235, 70, 60]]],
  wind_speed: [[0, [20, 60, 80]], [0.5, [60, 170, 190]], [1, [220, 130, 220]]],
  temperature: [[0, [40, 90, 200]], [0.4, [250, 210, 90]], [1, [230, 60, 50]]],
  pressure: [[0, [90, 60, 160]], [0.5, [150, 110, 210]], [1, [210, 200, 240]]],
  humidity: [[0, [30, 50, 70]], [0.5, [60, 130, 190]], [1, [140, 210, 235]]],
};
const colorAt = (palette: [number, [number, number, number]][], t: number) => {
  for (let i = 1; i < palette.length; i++) {
    if (t <= palette[i][0]) {
      const [t0, c0] = palette[i - 1]; const [t1, c1] = palette[i];
      const f = (t - t0) / (t1 - t0 || 1);
      return c0.map((c, k) => c + (c1[k] - c) * f) as [number, number, number];
    }
  }
  return palette[palette.length - 1][1];
};

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

/** Demo raster: renders a smooth 5 km-style field into a canvas for a BitmapLayer. */
export function makeFieldImage(event: WeatherEvent, variable: VariableId, lead: number, percentile: Percentile): HTMLCanvasElement {
  const N = 128;
  const canvas = document.createElement("canvas"); canvas.width = N; canvas.height = N;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(N, N);
  const seed = hash(event.id + variable);
  const rnd = (k: number) => { const x = Math.sin(seed * 0.13 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const blobs = Array.from({ length: 4 }, (_, k) => ({ x: 0.25 + rnd(k * 3) * 0.5, y: 0.25 + rnd(k * 3 + 1) * 0.5, s: 0.08 + rnd(k * 3 + 2) * 0.12, a: 0.5 + rnd(k * 7) * 0.5 }));
  const leadFactor = Math.max(0.15, 1 - Math.abs(lead - event.leadHours) / 90);
  const amp = pctFactor(percentile) * leadFactor;
  const palette = PALETTES[variable];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    let val = 0;
    for (const b of blobs) { const dx = u - b.x, dy = v - b.y; val += b.a * Math.exp(-(dx * dx + dy * dy) / b.s); }
    val = Math.min(1, val * amp);
    const [r, g, b] = colorAt(palette, val);
    const i = (y * N + x) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b;
    img.data[i + 3] = Math.min(1, val * 1.6) * 215; // transparent tail keeps terrain readable
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Original static bbox bounds (used for non-moving layers) */
export const fieldBounds = (event: WeatherEvent): [number, number, number, number] => [
  event.bbox[0] - 0.6, event.bbox[1] - 0.6, event.bbox[2] + 0.6, event.bbox[3] + 0.6,
];

/** Moving raster bounds centred on the interpolated storm position at a given lead.
 *  Half-size ~4° so the field blob fills the visible storm area at any zoom level. */
export function movingFieldBounds(lead: number): [number, number, number, number] {
  const c = interpolateStormCenter(lead);
  const half = 4.2; // degrees — big enough to show the full circulation
  return [c.lon - half, c.lat - half, c.lon + half, c.lat + half];
}

/** Sampled u/v-style wind vectors around the event (initial implementation, not particles). */
export function windVectors(event: WeatherEvent, lead: number) {
  const vectors: { from: [number, number]; to: [number, number]; speed: number }[] = [];
  const [w, s, e, n] = event.bbox;
  const seed = hash(event.id);
  for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) {
    const lon = w + ((i + 0.5) / 7) * (e - w);
    const lat = s + ((j + 0.5) / 5) * (n - s);
    const ang = Math.atan2(lat - event.centroid.lat, lon - event.centroid.lon) + Math.PI / 2 + Math.sin(seed + i * 2 + j) * 0.4 + lead * 0.005;
    const speed = 40 + Math.abs(Math.sin(seed + i * 3 + j * 5)) * 80;
    const len = 0.05 + speed / 2200;
    vectors.push({ from: [lon, lat], to: [lon + Math.cos(ang) * len, lat + Math.sin(ang) * len], speed });
  }
  return vectors;
}

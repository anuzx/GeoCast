import { z } from "zod";

export const severitySchema = z.enum(["critical", "severe", "moderate", "minor"]);
export type Severity = z.infer<typeof severitySchema>;

export const eventSchema = z.object({
  id: z.string(), type: z.string(), severity: severitySchema, probability: z.number(),
  validTime: z.string(), leadHours: z.number(), centroid: z.object({ lat: z.number(), lon: z.number() }),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  peak: z.object({ value: z.number(), unit: z.string() }),
});
export type WeatherEvent = z.infer<typeof eventSchema>;

export const events: WeatherEvent[] = z.array(eventSchema).parse([
  { id: "EVT-1021", type: "Extreme rainfall", severity: "severe", probability: .87, validTime: "2026-09-21T12:00:00Z", leadHours: 72, centroid: { lat: 23.6, lon: 87.4 }, bbox: [86.2, 22.7, 88.4, 24.5], peak: { value: 248, unit: "mm/6h" } },
  { id: "EVT-1034", type: "Cyclonic wind", severity: "critical", probability: .79, validTime: "2026-09-21T06:00:00Z", leadHours: 54, centroid: { lat: 19.3, lon: 85.1 }, bbox: [83.7, 18.1, 86.5, 20.6], peak: { value: 132, unit: "km/h" } },
  { id: "EVT-1042", type: "Heatwave", severity: "moderate", probability: .68, validTime: "2026-09-22T12:00:00Z", leadHours: 96, centroid: { lat: 27.1, lon: 75.8 }, bbox: [73.4, 25.3, 78.1, 29.2], peak: { value: 47.2, unit: "°C" } },
  { id: "EVT-1055", type: "Flash flood", severity: "severe", probability: .74, validTime: "2026-09-21T18:00:00Z", leadHours: 78, centroid: { lat: 26.2, lon: 91.7 }, bbox: [90.4, 25.3, 93.0, 27.1], peak: { value: 181, unit: "mm/6h" } },
  { id: "EVT-1061", type: "Cold wave", severity: "minor", probability: .56, validTime: "2026-09-23T00:00:00Z", leadHours: 108, centroid: { lat: 31.1, lon: 77.2 }, bbox: [75.5, 29.7, 79.2, 32.3], peak: { value: -7, unit: "°C anomaly" } },
]);

export const trajectory = [
  { time: "20 Sep, 12:00", lat: 22.9, lon: 85.9, intensity: 92, probability: .68 },
  { time: "21 Sep, 00:00", lat: 23.3, lon: 86.7, intensity: 132, probability: .79 },
  { time: "21 Sep, 12:00", lat: 23.6, lon: 87.4, intensity: 248, probability: .87 },
];

export const ensemble = [
  [[85.8, 22.8], [86.5, 23.4], [87.1, 24.0]],
  [[85.9, 22.7], [86.9, 23.2], [87.7, 24.1]],
  [[86.0, 23.0], [86.8, 23.5], [87.4, 23.8]],
];

export const alerts = [
  { id: "ALT-2021", eventId: "EVT-1021", severity: "severe" as const, message: "Extreme rainfall risk", place: "Durgapur, West Bengal", dispatchedAt: "12:03 UTC" },
  { id: "ALT-2030", eventId: "EVT-1034", severity: "critical" as const, message: "Cyclonic wind escalation", place: "Puri coast, Odisha", dispatchedAt: "11:48 UTC" },
  { id: "ALT-2038", eventId: "EVT-1055", severity: "severe" as const, message: "Flash flood conditions", place: "Guwahati, Assam", dispatchedAt: "11:31 UTC" },
  { id: "ALT-2041", eventId: "EVT-1042", severity: "moderate" as const, message: "Heat stress threshold", place: "Jaipur, Rajasthan", dispatchedAt: "10:57 UTC" },
];

export const metrics = { rmse: 12.4, mae: 7.1, crps: .18, fss: .71, csi: .66, p95Bias: .08, p99Bias: .12, peakError: 14.2 };

export async function getEvents() { await new Promise((r) => setTimeout(r, 180)); return events; }
export async function getEvent(id: string) { await new Promise((r) => setTimeout(r, 120)); return events.find((event) => event.id === id) ?? null; }

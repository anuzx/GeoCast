import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import type { WeatherEvent } from "../../../lib/weather-data";

export const severityColor = { critical: [255, 74, 94], severe: [255, 145, 61], moderate: [250, 204, 21], minor: [56, 189, 248] } as const;
export type Rgba = [number, number, number, number];
export const eventColor = (sev: WeatherEvent["severity"], a: number): Rgba => [...severityColor[sev], a] as Rgba;

const bboxPolygon = (e: WeatherEvent) => ({
  type: "Feature" as const,
  properties: { id: e.id, severity: e.severity, probability: e.probability, typeLabel: e.type, leadHours: e.leadHours },
  geometry: { type: "Polygon" as const, coordinates: [[[e.bbox[0], e.bbox[1]], [e.bbox[2], e.bbox[1]], [e.bbox[2], e.bbox[3]], [e.bbox[0], e.bbox[3]], [e.bbox[0], e.bbox[1]]]] },
});

/** Event footprints: bbox polygon fallback, subdued unless selected. */
export function footprintLayer(events: WeatherEvent[], selectedId: string | null, onSelect: (id: string) => void, onHover: (info: { x: number; y: number; object: unknown } | null) => void) {
  return new GeoJsonLayer({
    id: "event-footprints",
    data: events.map(bboxPolygon),
    pickable: true,
    stroked: true,
    filled: true,
    getFillColor: (f) => { const p = f.properties; return eventColor(p.severity, p.id === selectedId ? 46 : 16); },
    getLineColor: (f) => eventColor(f.properties.severity, f.properties.id === selectedId ? 235 : 110),
    getLineWidth: (f) => (f.properties.id === selectedId ? 2.4 : 1.1),
    lineWidthUnits: "pixels",
    onClick: (info) => info.object && onSelect(info.object.properties.id as string),
    onHover: (info) => onHover(info.object ? { x: info.x, y: info.y, object: info.object.properties } : null),
    updateTriggers: { all: selectedId },
  });
}

/** Centroid markers: solid center + translucent halo; only the selected event pulses. */
export function centroidLayers(events: WeatherEvent[], selectedId: string | null, pulse: number, onSelect: (id: string) => void, onHover: (info: { x: number; y: number; object: unknown } | null) => void) {
  return [
    new ScatterplotLayer({
      id: "centroid-pulse",
      data: events.filter((e) => e.id === selectedId),
      getPosition: (d: WeatherEvent) => [d.centroid.lon, d.centroid.lat],
      getRadius: (d: WeatherEvent) => (60000 + d.probability * 90000) * (1 + pulse * 0.35),
      radiusUnits: "meters",
      stroked: true,
      getFillColor: (d: WeatherEvent) => eventColor(d.severity, 14 + pulse * 20),
      getLineColor: (d: WeatherEvent) => eventColor(d.severity, 90 + pulse * 90),
      lineWidthMinPixels: 1,
      updateTriggers: { getRadius: pulse, getFillColor: pulse, getLineColor: pulse },
    }),
    new ScatterplotLayer({
      id: "centroid-halo",
      data: events,
      getPosition: (d: WeatherEvent) => [d.centroid.lon, d.centroid.lat],
      getRadius: (d: WeatherEvent) => 50000 + d.probability * 70000, // probability scales halo size
      radiusUnits: "meters",
      getFillColor: (d: WeatherEvent) => eventColor(d.severity, d.id === selectedId ? 26 : 14),
    }),
    new ScatterplotLayer({
      id: "centroid-core",
      data: events,
      pickable: true,
      autoHighlight: true,
      getPosition: (d: WeatherEvent) => [d.centroid.lon, d.centroid.lat],
      getRadius: (d: WeatherEvent) => (d.id === selectedId ? 24000 : 15000),
      radiusUnits: "meters",
      getFillColor: (d: WeatherEvent) => eventColor(d.severity, 235),
      stroked: true,
      getLineColor: [255, 255, 255, 215] as Rgba,
      lineWidthMinPixels: 1,
      onClick: (info) => info.object && onSelect((info.object as WeatherEvent).id),
      onHover: (info) => onHover(info.object ? { x: info.x, y: info.y, object: info.object } : null),
      updateTriggers: { getRadius: selectedId },
    }),
  ];
}

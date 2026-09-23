import { PathLayer } from "@deck.gl/layers";
import type { WeatherEvent } from "../../../lib/weather-data";
import { windVectors } from "../../../lib/map-data";

/** Sampled wind vector field (initial implementation; GPU particles come later). */
export function windLayer(event: WeatherEvent, lead: number) {
  const vectors = windVectors(event, lead);
  return [
    new PathLayer({
      id: "wind-vectors",
      data: vectors.map((v) => ({ path: [v.from, v.to], speed: v.speed })),
      getPath: (d) => d.path,
      getColor: (d) => [140, 210, 255, 90 + Math.min(140, d.speed)] as [number, number, number, number],
      getWidth: 2,
      widthMinPixels: 1.5,
    }),
    // small arrowhead tick
    new PathLayer({
      id: "wind-heads",
      data: vectors.map((v) => {
        const dx = v.to[0] - v.from[0], dy = v.to[1] - v.from[1];
        const back: [number, number] = [v.to[0] - dx * 0.35 - dy * 0.25, v.to[1] - dy * 0.35 + dx * 0.25];
        return { path: [back, v.to] };
      }),
      getPath: (d) => d.path,
      getColor: [170, 225, 255, 180],
      getWidth: 2,
      widthMinPixels: 1.5,
    }),
  ];
}

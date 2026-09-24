import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { TRAJECTORY } from "../../../lib/map-data";

/** Trajectory: muted past track, brighter future track, highlighted active point. */
export function trajectoryLayers(activeLead: number) {
  const idx = TRAJECTORY.reduce((best, p, i) => (Math.abs(p.lead - activeLead) < Math.abs(TRAJECTORY[best].lead - activeLead) ? i : best), 0);
  const past = TRAJECTORY.slice(0, idx + 1).map((p) => [p.lon, p.lat]);
  const future = TRAJECTORY.slice(idx).map((p) => [p.lon, p.lat]);
  const active = TRAJECTORY[idx];
  return [
    past.length > 1 && new PathLayer({
      id: "trajectory-past",
      data: [{ path: past }],
      getPath: (d) => d.path,
      getColor: [110, 150, 150, 120], // muted solid past
      getWidth: 3,
      widthMinPixels: 2,
    }),
    future.length > 1 && new PathLayer({
      id: "trajectory-future",
      data: [{ path: future }],
      getPath: (d) => d.path,
      getColor: [69, 224, 183, 240], // emphasized future
      getWidth: 4,
      widthMinPixels: 3,
    }),
    new ScatterplotLayer({
      id: "trajectory-points",
      data: TRAJECTORY,
      getPosition: (p) => [p.lon, p.lat],
      getRadius: (p) => (p.lead === active.lead ? 16000 : 8000),
      radiusUnits: "meters",
      getFillColor: (p) => (p.lead === active.lead ? [69, 224, 183, 255] : [160, 200, 200, 150]) as [number, number, number, number],
      updateTriggers: { all: active.lead },
    }),
  ].filter(Boolean);
}

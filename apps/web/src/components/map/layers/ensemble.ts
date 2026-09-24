import { PathLayer, PolygonLayer } from "@deck.gl/layers";
import { ENSEMBLE_MEMBERS, ENSEMBLE_SUMMARY } from "../../../lib/map-data";

/** Ensemble uncertainty: p50 main track, p10–p90 translucent corridor, optional members. */
export function ensembleLayers(showMembers: boolean) {
  const corridor = [...ENSEMBLE_SUMMARY.p10, ...[...ENSEMBLE_SUMMARY.p90].reverse()];
  return [
    new PolygonLayer({
      id: "ensemble-corridor",
      data: [{ polygon: corridor }],
      getPolygon: (d) => d.polygon,
      getFillColor: [116, 178, 255, 26],
      getLineColor: [116, 178, 255, 70],
      lineWidthMinPixels: 1,
      stroked: true,
    }),
    showMembers && new PathLayer({
      id: "ensemble-members",
      data: ENSEMBLE_MEMBERS.map((path) => ({ path })),
      getPath: (d) => d.path,
      getColor: [116, 178, 255, 80],
      getWidth: 1.5,
      widthMinPixels: 1,
    }),
    new PathLayer({
      id: "ensemble-p50",
      data: [{ path: ENSEMBLE_SUMMARY.p50 }],
      getPath: (d) => d.path,
      getColor: [150, 205, 255, 220],
      getWidth: 2.5,
      widthMinPixels: 2,
    }),
    new PathLayer({
      id: "ensemble-p10p90",
      data: [{ path: ENSEMBLE_SUMMARY.p10 }, { path: ENSEMBLE_SUMMARY.p90 }],
      getPath: (d) => d.path,
      getColor: [116, 178, 255, 110],
      getWidth: 1.5,
      widthMinPixels: 1,
      getDashArray: [4, 3],
    }),
  ].filter(Boolean);
}

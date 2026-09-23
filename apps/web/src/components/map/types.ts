import type { Percentile, VariableId } from "../../lib/map-data";

export type MapState = {
  selectedEventId: string | null;
  variable: VariableId;
  lead: number;
  percentile: Percentile;
  showTerrain: boolean;
  showField: boolean;
  showEvents: boolean;
  showTrajectory: boolean;
  showEnsemble: boolean;
  showWind: boolean;
  showBoundaries: boolean;
  view3d: boolean;
};

export const defaultMapState: MapState = {
  selectedEventId: null,
  variable: "precipitation",
  lead: 72,
  percentile: "p50",
  showTerrain: true,
  showField: true,
  showEvents: true,
  showTrajectory: true,
  showEnsemble: false,
  showWind: false,
  showBoundaries: true,
  view3d: true,
};

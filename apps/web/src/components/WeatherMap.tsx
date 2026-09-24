import { useEffect, useRef, useCallback, useState } from "react";
import { interpolateStormCenter } from "../lib/map-data";
import {
  AttributionControl,
  Map as MapLibreMapClass,
  Marker,
  NavigationControl,
  type Map as MapLibreMap,
} from "maplibre-gl";
import { MapLibreOverlay } from "@deck.gl/maplibre";
import type { Layer } from "@deck.gl/core";
import type { WeatherEvent } from "../lib/weather-data";
import type { MapState } from "./map/types";
import { footprintLayer, centroidLayers, severityColor } from "./map/layers/events";
import { trajectoryLayers } from "./map/layers/trajectory";
import { ensembleLayers } from "./map/layers/ensemble";
import { weatherRasterLayer, activeCoreLayer } from "./map/layers/weatherRaster";
import { windLayer } from "./map/layers/wind";
import "maplibre-gl/dist/maplibre-gl.css";

export type HoverInfo = { x: number; y: number; object: unknown } | null;

/** Free terrain tiles (AWS Open Data — no API key required). */
const TERRAIN_TILES =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

/** Lightweight India state GeoJSON. */
const INDIA_STATES_URL =
  "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

/** Build the CSS-animated pulse ring element for a MapLibre Marker. */
function createPulseEl(severity: WeatherEvent["severity"]): HTMLDivElement {
  const [r, g, b] = severityColor[severity];
  const color = `rgb(${r},${g},${b})`;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative;width:0;height:0;pointer-events:none;";

  const ring = document.createElement("div");
  ring.style.cssText = `
    position:absolute;
    width:72px;height:72px;
    top:-36px;left:-36px;
    border-radius:50%;
    border:2px solid ${color};
    opacity:0;
    animation:pulse-ring 2s ease-out infinite;
  `;

  const dot = document.createElement("div");
  dot.style.cssText = `
    position:absolute;
    width:14px;height:14px;
    top:-7px;left:-7px;
    border-radius:50%;
    background:${color};
    box-shadow:0 0 12px 3px ${color}aa;
  `;

  wrapper.appendChild(ring);
  wrapper.appendChild(dot);
  return wrapper;
}

interface Props {
  events: WeatherEvent[];
  mapState: MapState;
  onSelect: (id: string | null) => void;
  onHover: (info: HoverInfo) => void;
}

export function WeatherMap({ events, mapState, onSelect, onHover }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapLibreOverlay | null>(null);
  const pulseMarkerRef = useRef<Marker | null>(null);
  const loadedRef = useRef(false);

  const isDark = useIsDarkMode();
  const basemapStyle = isDark
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  // Mutable mirrors — stable callbacks can always read the latest values.
  const stateRef = useRef(mapState);
  stateRef.current = mapState;
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;

  const buildLayers = useCallback((): Layer[] => {
    const s = stateRef.current;
    const evts = eventsRef.current;
    const selectedEvent = evts.find((e) => e.id === s.selectedEventId) ?? null;
    const layers: Layer[] = [];

    if (s.showEvents) {
      layers.push(
        footprintLayer(
          evts,
          s.selectedEventId,
          (id) => onSelectRef.current(id),
          (info) => onHoverRef.current(info)
        ),
        ...centroidLayers(
          evts,
          s.selectedEventId,
          0,
          (id) => onSelectRef.current(id),
          (info) => onHoverRef.current(info)
        )
      );
    }

    if (s.showField && selectedEvent) {
      const key = `${selectedEvent.id}_${s.variable}_${s.lead}_${s.percentile}`;
      layers.push(
        weatherRasterLayer(selectedEvent, s.variable, s.lead, s.percentile, 0.82, key),
        activeCoreLayer(selectedEvent, s.lead)
      );
    }

    if (s.showTrajectory && s.selectedEventId) {
      layers.push(...(trajectoryLayers(s.lead).filter(Boolean) as Layer[]));
    }

    if (s.showEnsemble && s.selectedEventId) {
      layers.push(...(ensembleLayers(false).filter(Boolean) as Layer[]));
    }

    if (s.showWind && selectedEvent) {
      layers.push(...windLayer(selectedEvent, s.lead));
    }

    return layers;
  }, []);

  const flush = useCallback(() => {
    if (overlayRef.current && loadedRef.current) {
      overlayRef.current.setProps({ layers: buildLayers() });
    }
  }, [buildLayers]);

  // ── Map initialisation ───────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (mapRef.current) return;

    let destroyed = false;

    const map = new MapLibreMapClass({
      container: el,
      style: basemapStyle,
      center: [78.5, 22.5],
      zoom: 4.2,
      pitch: 35,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: true }), "bottom-left");
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    const overlay = new MapLibreOverlay({ interleaved: true, layers: [] });
    map.addControl(overlay);
    overlayRef.current = overlay;

    map.on("load", () => {
      if (destroyed) return;

      // DEM Terrain
      map.addSource("terrain-dem", {
        type: "raster-dem",
        tiles: [TERRAIN_TILES],
        tileSize: 256,
        encoding: "terrarium",
        maxzoom: 14,
      });

      if (stateRef.current.showTerrain && stateRef.current.view3d) {
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.4 });
      }

      // India state boundaries
      fetch(INDIA_STATES_URL)
        .then((r) => r.json())
        .then((data) => {
          if (destroyed || !mapRef.current) return;
          const m = mapRef.current;
          m.addSource("india-states", { type: "geojson", data });
          m.addLayer({
            id: "india-state-fill",
            type: "fill",
            source: "india-states",
            paint: { "fill-color": "rgba(100,150,200,0.025)" },
          });
          m.addLayer({
            id: "india-state-line",
            type: "line",
            source: "india-states",
            paint: {
              "line-color": "#7CA0C8",
              "line-width": 0.7,
              "line-opacity": 0.5,
            },
          });
          const vis = stateRef.current.showBoundaries ? "visible" : "none";
          m.setLayoutProperty("india-state-line", "visibility", vis);
          m.setLayoutProperty("india-state-fill", "visibility", vis);
        })
        .catch(() => {
          // Network fallback
        });

      loadedRef.current = true;
      flush();
    });

    mapRef.current = map;

    return () => {
      destroyed = true;
      pulseMarkerRef.current?.remove();
      pulseMarkerRef.current = null;
      try {
        map.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      overlayRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap Style change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    map.setStyle(basemapStyle);
    map.once("style.load", () => {
      if (!map.getSource("terrain-dem")) {
        map.addSource("terrain-dem", {
          type: "raster-dem",
          tiles: [TERRAIN_TILES],
          tileSize: 256,
          encoding: "terrarium",
          maxzoom: 14,
        });
      }
      if (stateRef.current.showTerrain && stateRef.current.view3d) {
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.4 });
      }
      flush();
    });
  }, [basemapStyle, flush]);

  // Layer update on state change
  useEffect(() => {
    flush();
  }, [mapState, flush]);

  // Pulse Marker — follows the interpolated trajectory position at the active lead.
  // Re-runs on both selectedEventId and lead changes so it moves during playback.
  useEffect(() => {
    const map = mapRef.current;

    pulseMarkerRef.current?.remove();
    pulseMarkerRef.current = null;

    if (!map || !mapState.selectedEventId) return;

    const ev = eventsRef.current.find((e) => e.id === mapState.selectedEventId);
    if (!ev) return;

    // Use trajectory position at this lead (or fall back to event centroid)
    const stormPos = interpolateStormCenter(mapState.lead);
    const lon = stormPos.lon;
    const lat = stormPos.lat;

    const el = createPulseEl(ev.severity);
    const marker = new Marker({ element: el, anchor: "center" })
      .setLngLat([lon, lat])
      .addTo(map);

    pulseMarkerRef.current = marker;

    return () => {
      marker.remove();
      pulseMarkerRef.current = null;
    };
  }, [mapState.selectedEventId, mapState.lead]);  // re-runs on every lead step

  // Camera fly-to on event selection: zoom to show full trajectory corridor (sea → land)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapState.selectedEventId) return;

    // Fit to the full trajectory corridor so the user can see the complete sea-to-land path
    map.fitBounds(
      [
        [82.0, 8.5],   // SW corner — open ocean near Sri Lanka
        [88.0, 23.0],  // NE corner — inland Odisha / Bengal
      ],
      {
        padding: 60,
        pitch: 45,
        duration: 1400,
        maxZoom: 7,
      }
    );
  }, [mapState.selectedEventId]);

  // Terrain toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (mapState.showTerrain && mapState.view3d) {
      map.setTerrain({ source: "terrain-dem", exaggeration: 1.4 });
    } else {
      map.setTerrain(null);
    }
  }, [mapState.showTerrain, mapState.view3d]);

  // Boundaries toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("india-state-line")) return;
    const vis = mapState.showBoundaries ? "visible" : "none";
    map.setLayoutProperty("india-state-line", "visibility", vis);
    map.setLayoutProperty("india-state-fill", "visibility", vis);
  }, [mapState.showBoundaries]);

  // Pitch toggle (2D vs 3D)
  useEffect(() => {
    mapRef.current?.easeTo({ pitch: mapState.view3d ? 35 : 0, duration: 600 });
  }, [mapState.view3d]);

  return (
    <div className="absolute inset-0 bg-map" aria-label="Interactive 3D India weather map">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

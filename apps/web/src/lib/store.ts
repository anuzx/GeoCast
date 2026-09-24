import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Percentile, VariableId } from "./map-data";

// ── 1. Theme Store ───────────────────────────────────────────────────────────
interface ThemeState {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          if (theme === "dark") {
            root.classList.add("dark");
          } else {
            root.classList.remove("dark");
          }
        }
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },
    }),
    {
      name: "geocast-theme-store",
    }
  )
);

// ── 2. Weather Map State Store ───────────────────────────────────────────────
export interface MapLayersState {
  lead: number;
  variable: VariableId;
  percentile: Percentile;
  showTerrain: boolean;
  showField: boolean;
  showEvents: boolean;
  showTrajectory: boolean;
  showEnsemble: boolean;
  showWind: boolean;
  showBoundaries: boolean;
  view3d: boolean;
  selectedEventId: string | null;
  isPlaying: boolean;
}

interface MapStore extends MapLayersState {
  setLead: (lead: number) => void;
  setVariable: (variable: VariableId) => void;
  setPercentile: (percentile: Percentile) => void;
  setSelectedEventId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleLayer: (key: keyof MapLayersState) => void;
  updateMapState: (patch: Partial<MapLayersState>) => void;
}

export const useMapStore = create<MapStore>()((set) => ({
  lead: 0,
  variable: "rain",
  percentile: "p50",
  showTerrain: false,
  showField: true,
  showEvents: true,
  showTrajectory: true,
  showEnsemble: false,
  showWind: false,
  showBoundaries: true,
  view3d: false,
  selectedEventId: "EVT-2026-0921",
  isPlaying: false,

  setLead: (lead) => set({ lead }),
  setVariable: (variable) => set({ variable }),
  setPercentile: (percentile) => set({ percentile }),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  toggleLayer: (key) => set((state) => ({ [key]: !state[key] })),
  updateMapState: (patch) => set((state) => ({ ...state, ...patch })),
}));

// ── 3. Settings Dialog & User Preferences Store ──────────────────────────────
interface SettingsStore {
  open: boolean;
  unitSystem: "metric" | "imperial";
  mapPitch: number;
  autoRefresh: boolean;
  region: string;
  webhookNotifications: boolean;
  soundAlerts: boolean;

  setOpen: (open: boolean) => void;
  setUnitSystem: (unit: "metric" | "imperial") => void;
  setMapPitch: (pitch: number) => void;
  setAutoRefresh: (auto: boolean) => void;
  setRegion: (region: string) => void;
  setWebhookNotifications: (webhook: boolean) => void;
  setSoundAlerts: (sound: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      open: false,
      unitSystem: "metric",
      mapPitch: 35,
      autoRefresh: true,
      region: "ap-south-1",
      webhookNotifications: true,
      soundAlerts: false,

      setOpen: (open) => set({ open }),
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setMapPitch: (mapPitch) => set({ mapPitch }),
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      setRegion: (region) => set({ region }),
      setWebhookNotifications: (webhookNotifications) => set({ webhookNotifications }),
      setSoundAlerts: (soundAlerts) => set({ soundAlerts }),
    }),
    {
      name: "geocast-settings-store",
    }
  )
);

import { useState } from "react";
import {
  Bell,
  Box,
  Check,
  Globe,
  Layers,
  Map,
  Moon,
  RotateCcw,
  Server,
  Sliders,
  Sun,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabCategory = "general" | "map" | "cloud" | "alerts" | "appearance";

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>("general");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings state
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [mapPitch, setMapPitch] = useState(35);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [region, setRegion] = useState("ap-south-1");
  const [webhookNotifications, setWebhookNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-xl border border-border bg-background shadow-2xl noise-texture">
        <DialogHeader className="sr-only">
          <DialogTitle>GeoCast Settings</DialogTitle>
        </DialogHeader>

        {/* ── Two-Column Layout ──────────────────────────────── */}
        <div className="grid md:grid-cols-[210px_1fr] h-[520px]">
          {/* Left Sidebar Navigation */}
          <div className="border-r border-border bg-accent/20 p-3 flex flex-col gap-1">
            <div className="px-3 py-2 border-b border-border/60 mb-2">
              <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Sliders size={14} />
                GeoCast Settings
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                System Preferences & Engine
              </span>
            </div>

            {[
              { id: "general", label: "General", icon: Sliders },
              { id: "map", label: "Map & 3D Engine", icon: Map },
              { id: "cloud", label: "Cloud Pipeline", icon: Server },
              { id: "alerts", label: "Alert Dispatch", icon: Bell },
              { id: "appearance", label: "Appearance", icon: Sun },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabCategory)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  activeTab === id
                    ? "bg-foreground text-background font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Right Tab Content Area */}
          <div className="flex flex-col justify-between p-6 bg-background">
            <div className="space-y-5 overflow-y-auto pr-1">
              {/* ── General Tab ─────────────────────────────────────── */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">General Preferences</h3>
                    <p className="text-xs text-muted-foreground">
                      Configure operational unit formats and dataset refresh intervals.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4 shadow-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Unit System</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setUnitSystem("metric")}
                          className={`h-9 rounded-lg border text-xs font-medium transition-all ${
                            unitSystem === "metric"
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-muted-foreground hover:border-foreground"
                          }`}
                        >
                          Metric (°C, mm/h, km/h)
                        </button>
                        <button
                          onClick={() => setUnitSystem("imperial")}
                          className={`h-9 rounded-lg border text-xs font-medium transition-all ${
                            unitSystem === "imperial"
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-muted-foreground hover:border-foreground"
                          }`}
                        >
                          Imperial (°F, in/h, mph)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div>
                        <span className="text-xs font-medium text-foreground block">
                          Auto Data Stream Refresh
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Fetch 5km weather rasters every 60s
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="size-4 accent-foreground rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Map Tab ─────────────────────────────────────────── */}
              {activeTab === "map" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">Map & 3D Projections</h3>
                    <p className="text-xs text-muted-foreground">
                      Adjust camera tilt, terrain DEM exaggeration, and basemap layers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <label className="font-medium text-foreground">Default 3D Pitch Angle</label>
                        <span className="font-mono font-semibold">{mapPitch}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        step={5}
                        value={mapPitch}
                        onChange={(e) => setMapPitch(Number(e.target.value))}
                        className="w-full accent-foreground"
                      />
                    </div>

                    <div className="pt-2 border-t border-border/60 space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Carto Basemap Style</label>
                      <select className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-foreground">
                        <option value="auto">Auto (Matches Theme)</option>
                        <option value="dark">CARTO Dark Matter</option>
                        <option value="light">CARTO Positron</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Cloud Tab ─────────────────────────────────────────── */}
              {activeTab === "cloud" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">Cloud Infrastructure Config</h3>
                    <p className="text-xs text-muted-foreground">
                      Manage data region endpoints, NetCDF bucket storage, and ingest triggers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Data Region Endpoint</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-foreground"
                      >
                        <option value="ap-south-1">ap-south-1 (Asia South)</option>
                        <option value="ap-southeast-1">ap-southeast-1 (Asia SE)</option>
                        <option value="eu-central-1">eu-central-1 (Europe)</option>
                      </select>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-accent/30 p-3 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Radar NetCDF Bucket:</span>
                        <span className="text-foreground font-semibold">s3://geocast-radar-stream</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Ingestion Pipeline:</span>
                        <span className="text-safe font-semibold">Active (0ms latency)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Alerts Tab ──────────────────────────────────────── */}
              {activeTab === "alerts" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">Alert Notifications</h3>
                    <p className="text-xs text-muted-foreground">
                      Configure webhook dispatches and high-severity sound notifications.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-foreground block">
                          Realtime Event Webhook
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Dispatch critical severe events to operational webhook endpoint
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={webhookNotifications}
                        onChange={(e) => setWebhookNotifications(e.target.checked)}
                        className="size-4 accent-foreground cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div>
                        <span className="text-xs font-medium text-foreground block">
                          Audio Chime on Critical Event
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Play sound alert when critical rainfall is detected
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={soundAlerts}
                        onChange={(e) => setSoundAlerts(e.target.checked)}
                        className="size-4 accent-foreground cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Appearance Tab ──────────────────────────────────── */}
              {activeTab === "appearance" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">Appearance & Theme</h3>
                    <p className="text-xs text-muted-foreground">
                      Toggle monochrome theme palette and typography scaling.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Color Mode</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Header Sun/Moon Toggle
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AmarJay Footer Action Bar */}
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-end gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex h-9 items-center gap-1.5 px-4 rounded-lg bg-foreground text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                {savedSuccess ? <Check size={14} /> : null}
                {savedSuccess ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

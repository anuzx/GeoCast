import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  RotateCcw,
  Zap,
} from "lucide-react";
import { TIMESTEPS } from "../../lib/storm-data";

interface Props {
  activeLead: number;
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, 5x
  onLeadChange: (lead: number) => void;
  onPlayPauseToggle: () => void;
  onSpeedChange: (speed: number) => void;
}

export function StormTimeline({
  activeLead,
  isPlaying,
  playbackSpeed,
  onLeadChange,
  onPlayPauseToggle,
  onSpeedChange,
}: Props) {
  const currentIndex = TIMESTEPS.findIndex((t) => t.lead === activeLead);
  const currentStep = TIMESTEPS[currentIndex] ?? TIMESTEPS[2]; // Default to lead 0

  const handlePrev = () => {
    if (currentIndex > 0) {
      onLeadChange(TIMESTEPS[currentIndex - 1].lead);
    }
  };

  const handleNext = () => {
    if (currentIndex < TIMESTEPS.length - 1) {
      onLeadChange(TIMESTEPS[currentIndex + 1].lead);
    } else {
      onLeadChange(TIMESTEPS[0].lead);
    }
  };

  return (
    <div className="pointer-events-none absolute bottom-5 left-0 right-0 z-30 flex items-center justify-center px-4">
      <div className="pointer-events-auto flex flex-col items-center w-full max-w-xl storm-glass-panel p-3 shadow-2xl space-y-2">
        {/* Top Info & Playback Controls Header */}
        <div className="w-full flex items-center justify-between gap-3 text-xs">
          {/* Current Date & Timestep Indicator */}
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-teal-400" />
            <span className="font-semibold text-white">
              {currentStep.timeLabel}
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                currentStep.lead <= 0
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              }`}
            >
              {currentStep.lead <= 0 ? "PAST" : `FORECAST T+${currentStep.lead}h`}
            </span>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
              title="Previous Timestep"
            >
              <SkipBack className="size-3.5" />
            </button>

            <button
              onClick={onPlayPauseToggle}
              className={`flex items-center justify-center size-8 rounded-lg transition-all ${
                isPlaying
                  ? "bg-amber-500/25 text-amber-300 border border-amber-400/40"
                  : "bg-teal-500/30 text-teal-200 border border-teal-400/50 hover:bg-teal-500/40"
              }`}
              title={isPlaying ? "Pause Forecast Loop" : "Play Forecast Loop"}
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4 ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Next Timestep"
            >
              <SkipForward className="size-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeedChange(spd)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  playbackSpeed === spd
                    ? "bg-teal-400/20 text-teal-300 font-bold border border-teal-400/40"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Scrubber Bar */}
        <div className="w-full space-y-1">
          <div className="relative w-full h-3 flex items-center">
            {/* Background Track */}
            <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10 overflow-hidden flex">
              <div
                className="h-full bg-blue-500/40"
                style={{ width: `${(2 / (TIMESTEPS.length - 1)) * 100}%` }}
              />
              <div
                className="h-full bg-teal-500/40"
                style={{ width: `${((TIMESTEPS.length - 3) / (TIMESTEPS.length - 1)) * 100}%` }}
              />
            </div>

            {/* Timestep Nodes */}
            <div className="absolute inset-x-0 flex justify-between items-center px-0.5">
              {TIMESTEPS.map((step, idx) => {
                const isActive = step.lead === activeLead;
                const isPast = step.lead <= 0;
                return (
                  <button
                    key={step.lead}
                    onClick={() => onLeadChange(step.lead)}
                    className={`group relative size-3 flex items-center justify-center rounded-full transition-all ${
                      isActive
                        ? "size-4 bg-teal-400 ring-4 ring-teal-400/30 z-10 shadow-[0_0_10px_#52e0c4]"
                        : isPast
                        ? "bg-blue-400/80 hover:bg-blue-300"
                        : "bg-teal-500/80 hover:bg-teal-300"
                    }`}
                    title={`${step.timeLabel} (${step.lead <= 0 ? "Past" : `+${step.lead}h`})`}
                  >
                    {!isActive && (
                      <span className="size-1.5 rounded-full bg-black/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Past / Forecast Labels */}
          <div className="w-full flex justify-between text-[9px] font-mono text-white/40 uppercase tracking-widest px-0.5">
            <span>Past (-24h)</span>
            <span className="text-teal-400/80 font-bold">Present (T+0h)</span>
            <span>Forecast (+120h)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

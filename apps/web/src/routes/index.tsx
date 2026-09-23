import { createFileRoute } from "@tanstack/react-router";
import { WeatherMapSection } from "../components/map/WeatherMapSection";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "3D India Weather Map — GeoCast" },
      {
        name: "description",
        content: "Interactive 3D weather map showing extreme weather events, downscaled fields, trajectories, and ensemble spreads across India.",
      },
      { property: "og:title", content: "3D India Weather Map — GeoCast" },
      {
        property: "og:description",
        content: "Interactive 3D weather map showing extreme weather events, downscaled fields, trajectories, and ensemble spreads across India.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    // On mobile: full viewport minus top navbar (3.5rem) and bottom nav (3.5rem)
    // On md+: full viewport minus top navbar only (sidebar is beside, not below)
    <div className="relative h-[calc(100svh-7rem)] w-full overflow-hidden bg-map md:h-[calc(100svh-3.5rem)]">
      <WeatherMapSection />
    </div>
  );
}


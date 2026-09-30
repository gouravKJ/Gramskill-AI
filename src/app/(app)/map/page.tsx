import type { Metadata } from "next";
import { Compass, MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OpportunityMap } from "@/components/map/opportunity-map";
import { requireWorkspace } from "@/lib/server/workspace";
import { buildMapData } from "@/lib/server/map-data";

export const metadata: Metadata = { title: "Local Opportunity Map" };

export default async function MapPage() {
  // requireWorkspace guarantees an authenticated session for the map origin.
  await requireWorkspace();
  const { origin, markers, disclaimer } = await buildMapData();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <MapPinned className="size-5 text-primary" />
            Local Opportunity Map
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Nearby jobs, training centres, apprenticeships and community programmes plotted against your
            location — so “is this reachable?” is answerable at a glance.
          </p>
        </div>
        <Badge variant="demo" className="gap-1.5">
          <Compass className="size-3" />
          Synthetic demo coordinates
        </Badge>
      </header>

      <OpportunityMap markers={markers} origin={origin} disclaimer={disclaimer} />
    </div>
  );
}

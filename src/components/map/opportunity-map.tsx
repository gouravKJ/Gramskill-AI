"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Landmark, MapPin, Route, Building2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MapMarker, MapMarkerKind, MapOrigin } from "@/types/map";

/**
 * Local Opportunity Map.
 *
 * Rendered as a lightweight SVG plot rather than an embedded tile provider:
 * this keeps the page usable on low bandwidth, avoids a third-party API key and
 * makes it impossible to mistake the synthetic coordinates for real places. The
 * component is intentionally a thin view over `MapMarker[]`, so swapping in a
 * real mapping library later requires no data changes.
 */

const KIND_META: Record<
  MapMarkerKind,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  JOB: { label: "Job", icon: Briefcase, color: "hsl(var(--chart-1))" },
  GOVERNMENT: { label: "Government job", icon: Landmark, color: "hsl(var(--chart-2))" },
  APPRENTICESHIP: { label: "Apprenticeship", icon: Route, color: "hsl(var(--chart-3))" },
  TRAINING: { label: "Training centre", icon: GraduationCap, color: "hsl(var(--chart-4))" },
  CENTRE: { label: "Skill centre", icon: Building2, color: "hsl(var(--chart-5))" },
};

const ALL_KINDS = Object.keys(KIND_META) as MapMarkerKind[];

export function OpportunityMap({
  markers,
  origin,
  disclaimer,
}: {
  markers: MapMarker[];
  origin: MapOrigin | null;
  disclaimer: string;
}) {
  const [activeKinds, setActiveKinds] = React.useState<Set<MapMarkerKind>>(new Set(ALL_KINDS));
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [maxDistance, setMaxDistance] = React.useState(0);

  const visible = React.useMemo(
    () =>
      markers
        .filter((marker) => activeKinds.has(marker.kind))
        .filter((marker) => (maxDistance ? (marker.distanceKm ?? 0) <= maxDistance : true)),
    [markers, activeKinds, maxDistance],
  );

  const selected = visible.find((marker) => marker.id === selectedId) ?? null;

  /** Project lat/lng into the SVG viewBox with a small padding. */
  const bounds = React.useMemo(() => {
    const points = origin ? [...visible, { lat: origin.lat, lng: origin.lng }] : visible;
    if (!points.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const padLat = Math.max(0.05, (Math.max(...lats) - Math.min(...lats)) * 0.12);
    const padLng = Math.max(0.05, (Math.max(...lngs) - Math.min(...lngs)) * 0.12);
    return {
      minLat: Math.min(...lats) - padLat,
      maxLat: Math.max(...lats) + padLat,
      minLng: Math.min(...lngs) - padLng,
      maxLng: Math.max(...lngs) + padLng,
    };
  }, [visible, origin]);

  const project = React.useCallback(
    (lat: number, lng: number) => {
      const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 100;
      const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * 100;
      return { x, y };
    },
    [bounds],
  );

  const toggleKind = (kind: MapMarkerKind) => {
    setActiveKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next.size ? next : new Set(ALL_KINDS);
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-primary" />
              Opportunities around you
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {visible.length} markers · {origin ? `centred on ${origin.name}` : "no home location set"}
            </p>
          </div>
          <Badge variant="demo">Demo coordinates</Badge>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted/40">
            {/* distance rings */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="none">
              {[18, 32, 46].map((r, index) => (
                <circle
                  key={r}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeDasharray="2 2"
                  strokeWidth={0.2}
                />
              ))}
              <text x="50" y={50 - 46} fontSize="2" textAnchor="middle" fill="hsl(var(--muted-foreground))">
                ~{maxDistance || "all"} km
              </text>
            </svg>

            {visible.map((marker, index) => {
              const position = project(marker.lat, marker.lng);
              const meta = KIND_META[marker.kind];
              const Icon = meta.icon;
              return (
                <motion.button
                  key={marker.id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.4) }}
                  onClick={() => setSelectedId(marker.id)}
                  style={{ left: `${position.x}%`, top: `${position.y}%`, color: meta.color }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card p-1.5 shadow-sm transition-transform hover:scale-125 focus-visible:scale-125",
                    selectedId === marker.id && "scale-125 ring-2 ring-primary",
                  )}
                  aria-label={`${meta.label}: ${marker.title}`}
                  title={`${meta.label} · ${marker.title}`}
                >
                  <Icon className="size-3" />
                </motion.button>
              );
            })}

            {origin && (
              <span
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${project(origin.lat, origin.lng).x}%`, top: `${project(origin.lat, origin.lng).y}%` }}
              >
                <span className="grid size-4 place-items-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground ring-4 ring-primary/20">
                  You
                </span>
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_KINDS.map((kind) => {
              const meta = KIND_META[kind];
              const count = markers.filter((m) => m.kind === kind).length;
              const active = activeKinds.has(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => toggleKind(kind)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  <span className="size-2 rounded-full" style={{ background: meta.color }} aria-hidden />
                  {meta.label}
                  <span className="tabular-nums text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label htmlFor="map-distance" className="text-xs text-muted-foreground">
              Distance filter
            </label>
            <input
              id="map-distance"
              type="range"
              min={0}
              max={250}
              step={10}
              value={maxDistance}
              onChange={(event) => setMaxDistance(Number(event.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-[hsl(var(--primary))]"
            />
            <span className="w-16 text-right text-xs tabular-nums">
              {maxDistance ? `≤ ${maxDistance} km` : "Any"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {selected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {React.createElement(KIND_META[selected.kind].icon, { className: "size-4" })}
                {selected.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{selected.subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Location</dt>
                  <dd className="mt-0.5 font-medium">{selected.locationName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">District</dt>
                  <dd className="mt-0.5 font-medium">{selected.district}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Distance</dt>
                  <dd className="mt-0.5 font-medium">
                    {selected.distanceKm != null ? `${selected.distanceKm} km` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">AI match</dt>
                  <dd className="mt-0.5 font-medium">
                    {selected.matchScore != null ? `${selected.matchScore}%` : "—"}
                  </dd>
                </div>
              </dl>
              <Button asChild size="sm" className="w-full">
                <Link href={selected.href}>Open details</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-start gap-3 pt-5 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              Tap any marker on the map to see the opportunity, its distance and your match score.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nearest to you</CardTitle>
            <p className="text-xs text-muted-foreground">Sorted by straight-line distance from your location.</p>
          </CardHeader>
          <CardContent className="max-h-80 space-y-2 overflow-y-auto">
            {[...visible]
              .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
              .slice(0, 12)
              .map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => setSelectedId(marker.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    selectedId === marker.id ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/60",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: KIND_META[marker.kind].color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{marker.title}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {marker.locationName} · {marker.subtitle}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {marker.distanceKm != null ? `${marker.distanceKm} km` : "—"}
                  </span>
                </button>
              ))}
            {visible.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No markers match the current filters.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 px-3 py-2.5 text-[11px] leading-relaxed text-secondary">
          {disclaimer}
        </p>
      </div>
    </div>
  );
}

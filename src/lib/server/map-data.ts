import { getRepository } from "@/lib/data/repository";
import { getSession } from "@/lib/auth/session";
import { matchJobs } from "@/lib/ai/match-engine";
import { locationById } from "@/lib/data/catalogue";
import { distanceKm } from "@/lib/utils";
import type { MapMarker, MapOrigin } from "@/types/map";

/**
 * Builds the synthetic marker set for the Local Opportunity Map.
 *
 * Used by both GET /api/map and the /map page so the interface and the API
 * can never disagree. Coordinates come from the bundled demo location table —
 * there is no geocoding provider involved, and the UI says so.
 */
export async function buildMapData(): Promise<{
  origin: MapOrigin | null;
  markers: MapMarker[];
  disclaimer: string;
}> {
  const repo = await getRepository();
  const session = await getSession();
  const user = session ? await repo.findUserById(session.id) : null;

  const [jobs, training, locations] = await Promise.all([
    repo.allJobs(),
    repo.listTraining(),
    repo.listLocations(),
  ]);

  const originLocation = user ? locationById(user.profile.locationId) : null;
  const origin: MapOrigin | null = originLocation
    ? {
        id: originLocation.id,
        name: originLocation.name,
        district: originLocation.district,
        lat: originLocation.lat,
        lng: originLocation.lng,
      }
    : null;

  const scored = user ? matchJobs(user.profile, { jobs, corpus: jobs }) : [];
  const markers: MapMarker[] = [];

  for (const job of jobs) {
    const location = locationById(job.locationId);
    markers.push({
      id: `job-${job.id}`,
      kind:
        job.source === "APPRENTICESHIP"
          ? "APPRENTICESHIP"
          : job.source === "GOVERNMENT"
            ? "GOVERNMENT"
            : "JOB",
      title: job.title,
      subtitle: `${job.company} · ${job.sector}`,
      locationId: job.locationId,
      locationName: location.name,
      district: location.district,
      lat: location.lat,
      lng: location.lng,
      href: `/jobs/${job.id}`,
      salary: job.salaryMax,
      matchScore: scored.find((s) => s.job.id === job.id)?.score ?? null,
      distanceKm: originLocation && job.workMode !== "REMOTE" ? distanceKm(originLocation, location) : null,
    });
  }

  for (const programme of training) {
    const location = programme.locationId ? locationById(programme.locationId) : null;
    if (!location) continue;
    markers.push({
      id: `training-${programme.id}`,
      kind: "TRAINING",
      title: programme.title,
      subtitle: `${programme.provider} · ${programme.durationWeeks} weeks`,
      locationId: location.id,
      locationName: location.name,
      district: location.district,
      lat: location.lat,
      lng: location.lng,
      href: "/training",
      salary: null,
      matchScore: null,
      distanceKm: originLocation ? distanceKm(originLocation, location) : null,
    });
  }

  for (const location of locations.filter((l) => l.isRural)) {
    markers.push({
      id: `centre-${location.id}`,
      kind: "CENTRE",
      title: `${location.district} Block Skill Centre (Demo)`,
      subtitle: "Counselling, computer lab and placement desk",
      locationId: location.id,
      locationName: location.name,
      district: location.district,
      lat: location.lat,
      lng: location.lng,
      href: "/opportunities",
      salary: null,
      matchScore: null,
      distanceKm: originLocation ? distanceKm(originLocation, location) : null,
    });
  }

  return {
    origin,
    markers,
    disclaimer:
      "Demo coordinates. These are synthetic placeholders for the academic prototype — not verified real-world locations, and not live job listings.",
  };
}

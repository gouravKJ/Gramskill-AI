import { getRepository } from "@/lib/data/repository";
import { getSession } from "@/lib/auth/session";
import { handler, ok } from "@/lib/api/http";
import { jobFiltersSchema } from "@/lib/validators";
import type { JobFilters } from "@/types";

export const dynamic = "force-dynamic";

function parseFilters(searchParams: URLSearchParams): JobFilters {
  const list = (key: string) => {
    const raw = searchParams.getAll(key).flatMap((v) => v.split(",")).filter(Boolean);
    return raw.length ? raw : undefined;
  };

  const parsed = jobFiltersSchema.parse({
    query: searchParams.get("query") ?? undefined,
    skills: list("skills"),
    locationIds: list("locationIds"),
    jobTypes: list("jobTypes"),
    workModes: list("workModes"),
    sources: list("sources"),
    minSalary: searchParams.get("minSalary") ? Number(searchParams.get("minSalary")) : undefined,
    maxDistanceKm: searchParams.get("maxDistanceKm")
      ? Number(searchParams.get("maxDistanceKm"))
      : undefined,
    education: searchParams.get("education") ?? undefined,
    sector: searchParams.get("sector") ?? undefined,
    ruralFriendlyOnly: searchParams.get("ruralFriendlyOnly") === "true" ? true : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
    sort: (searchParams.get("sort") as JobFilters["sort"]) ?? undefined,
  });

  return parsed as JobFilters;
}

export const GET = handler(async (request: Request) => {
  const url = new URL(request.url);
  const filters = parseFilters(url.searchParams);

  const repo = await getRepository();
  const session = await getSession();
  const user = session ? await repo.findUserById(session.id) : null;

  const page = await repo.getJobs(filters, user?.profile.locationId);
  return ok(page);
});

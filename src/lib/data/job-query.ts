import { EDUCATION_ORDER, locationById } from "@/lib/data/catalogue";
import { distanceKm } from "@/lib/utils";
import type { Job, JobFilters, Paginated } from "@/types";

/**
 * Pure job-query helpers shared by every repository implementation and by the
 * agent tools, so filtering behaviour is identical everywhere.
 */

export const DEFAULT_PAGE_SIZE = 9;

export function filterJobs(
  jobs: Job[],
  filters: JobFilters = {},
  originLocationId?: string,
): Job[] {
  const {
    query,
    skills = [],
    locationIds = [],
    jobTypes = [],
    workModes = [],
    sources = [],
    minSalary,
    maxDistanceKm,
    education,
    sector,
    ruralFriendlyOnly,
  } = filters;

  const needle = query?.trim().toLowerCase();

  let result = jobs.filter((job) => {
    if (needle) {
      const haystack = [
        job.title,
        job.company,
        job.sector,
        job.description,
        locationById(job.locationId).name,
        job.skills.map((s) => s.skillId).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    // Skill filter uses OR semantics — a seeker ticking "Excel" and "Tally"
    // wants jobs asking for either, not only jobs asking for both.
    if (skills.length && !job.skills.some((js) => skills.includes(js.skillId))) return false;
    if (locationIds.length && !locationIds.includes(job.locationId)) return false;
    if (jobTypes.length && !jobTypes.includes(job.jobType)) return false;
    if (workModes.length && !workModes.includes(job.workMode)) return false;
    if (sources.length && !sources.includes(job.source)) return false;
    if (minSalary != null && (job.salaryMax ?? job.salaryMin ?? 0) < minSalary) return false;
    if (sector && job.sector !== sector) return false;
    if (ruralFriendlyOnly && !job.isRuralFriendly) return false;
    if (education && EDUCATION_ORDER[job.educationRequired] < EDUCATION_ORDER[education]) return false;
    return true;
  });

  if (maxDistanceKm != null && originLocationId) {
    const origin = locationById(originLocationId);
    result = result.filter((job) => {
      if (job.workMode === "REMOTE") return true;
      return distanceKm(origin, locationById(job.locationId)) <= maxDistanceKm;
    });
  }

  const sort = filters.sort ?? "recent";
  return [...result].sort((a, b) => {
    if (sort === "salary") return (b.salaryMax ?? 0) - (a.salaryMax ?? 0);
    if (sort === "relevance") return a.title.localeCompare(b.title);
    return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
  });
}

export function paginate<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

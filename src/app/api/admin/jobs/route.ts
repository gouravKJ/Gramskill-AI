import { requireAdmin } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { enforceRateLimit, handler, ok } from "@/lib/api/http";
import { jobUpsertSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/admin/jobs — create or update a posting. */
export const POST = handler(async (request: Request) => {
  const session = await requireAdmin();
  enforceRateLimit(request, `admin:${session.id}`, { capacity: 40, refillPerSecond: 0.5 });

  const input = jobUpsertSchema.parse(await request.json().catch(() => ({})));
  const repo = await getRepository();

  const id = input.id ?? `job-${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + input.deadlineInDays);

  const job = await repo.upsertJob({
    id,
    title: input.title,
    company: input.company,
    companyType: input.companyType,
    sector: input.sector,
    source: input.source,
    description: input.description,
    requirements: input.requirements,
    responsibilities: input.responsibilities,
    locationId: input.locationId,
    workMode: input.workMode,
    jobType: input.jobType,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    experienceRequired: input.experienceRequired,
    educationRequired: input.educationRequired,
    openings: input.openings,
    postedAt: new Date().toISOString(),
    deadline: deadline.toISOString(),
    isRuralFriendly: input.isRuralFriendly,
    localLanguageSupport: input.localLanguageSupport,
    contactEmail: input.contactEmail,
    skills: input.skills.map((s) => ({
      skillId: s.skillId,
      importance: s.importance,
      minProficiency: s.importance === "REQUIRED" ? "INTERMEDIATE" : "BEGINNER",
    })),
  });

  return ok({ job, created: !input.id });
});

import { requireAdmin } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { handler, ok } from "@/lib/api/http";
import { trainingUpsertSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** POST /api/admin/training — create or update a training programme. */
export const POST = handler(async (request: Request) => {
  await requireAdmin();
  const input = trainingUpsertSchema.parse(await request.json().catch(() => ({})));
  const repo = await getRepository();

  const id = input.id ?? `trn-${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

  const training = await repo.upsertTraining({
    id,
    title: input.title,
    provider: input.provider,
    description: input.description,
    durationWeeks: input.durationWeeks,
    mode: input.mode,
    language: input.language,
    cost: input.cost,
    certification: input.certification,
    rating: 4.2,
    enrolments: 0,
    skillIds: input.skillIds,
    careerPath: input.careerPath,
    locationId: input.locationId,
  });

  return ok({ training, created: !input.id });
});

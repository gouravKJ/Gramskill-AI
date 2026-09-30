import { getRepository } from "@/lib/data/repository";
import { getSession } from "@/lib/auth/session";
import { fail, handler, ok } from "@/lib/api/http";
import { matchJob } from "@/lib/ai/match-engine";
import { locationById } from "@/lib/data/catalogue";

export const dynamic = "force-dynamic";

export const GET = handler(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const repo = await getRepository();
  const job = await repo.getJob(id);
  if (!job) return fail("That job is not available in the current dataset.", 404);

  const session = await getSession();
  const user = session ? await repo.findUserById(session.id) : null;

  if (!user) return ok({ job, location: locationById(job.locationId), match: null });

  const jobs = await repo.allJobs();
  const match = matchJob(user.profile, job, { corpus: jobs });
  return ok({ job, location: locationById(job.locationId), match });
});

import { getRepository } from "@/lib/data/repository";
import { handler, ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** GET /api/reference — locations + skill catalogue (used by the wizard and filters). */
export const GET = handler(async () => {
  const repo = await getRepository();
  const [locations, skills] = await Promise.all([repo.listLocations(), repo.listSkills()]);
  return ok({ locations, skills });
});

import { getRepository } from "@/lib/data/repository";
import { requireUser } from "@/lib/auth/session";
import { handler, ok } from "@/lib/api/http";
import { profileSchema } from "@/lib/validators";
import { profileCompletion } from "@/lib/server/workspace";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const session = await requireUser();
  const repo = await getRepository();
  const user = await repo.findUserById(session.id);
  if (!user) return ok({ profile: null });
  return ok({ profile: user.profile, completion: profileCompletion(user.profile) });
});

export const PUT = handler(async (request: Request) => {
  const session = await requireUser();
  const body = await request.json().catch(() => ({}));
  const patch = profileSchema.parse(body);

  const repo = await getRepository();
  const profile = await repo.updateProfile(session.id, patch);
  return ok({ profile, completion: profileCompletion(profile) });
});

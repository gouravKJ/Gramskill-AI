import { getSession } from "@/lib/auth/session";
import { handler, ok } from "@/lib/api/http";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const session = await getSession();
  if (!session) return ok({ authenticated: false as const });

  const repo = await getRepository();
  const user = await repo.findUserById(session.id);

  return ok({
    authenticated: true as const,
    user: {
      id: session.id,
      email: session.email,
      role: session.role,
      name: user?.profile.name ?? session.name,
    },
    needsOnboarding: user ? !user.profile.onboardingCompleted : true,
    dataSource: repo.source,
  });
});

import { getRepository } from "@/lib/data/repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { enforceRateLimit, fail, handler, ok } from "@/lib/api/http";
import { loginSchema } from "@/lib/validators";

export const POST = handler(async (request: Request) => {
  // Tight limit: this is the endpoint most exposed to credential stuffing.
  enforceRateLimit(request, "auth:login", { capacity: 10, refillPerSecond: 0.15 });

  const body = await request.json().catch(() => ({}));
  const input = loginSchema.parse(body);

  const repo = await getRepository();
  const user = await repo.findUserByEmail(input.email);

  // Same generic message for unknown email and wrong password — no user enumeration.
  const invalid = () => fail("Incorrect email or password.", 401);
  if (!user) return invalid();

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return invalid();

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.profile.name,
  });
  await setSessionCookie(token);

  return ok({
    user: { id: user.id, email: user.email, role: user.role, name: user.profile.name },
    needsOnboarding: !user.profile.onboardingCompleted,
  });
});

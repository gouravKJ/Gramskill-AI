import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data/repository";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { enforceRateLimit, fail, handler, ok } from "@/lib/api/http";
import { registerSchema } from "@/lib/validators";

export const POST = handler(async (request: Request) => {
  enforceRateLimit(request, "auth:register", { capacity: 8, refillPerSecond: 0.2 });

  const body = await request.json().catch(() => ({}));
  const input = registerSchema.parse(body);

  const repo = await getRepository();
  const existing = await repo.findUserByEmail(input.email);
  if (existing) {
    return fail("An account with this email already exists. Try signing in instead.", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await repo.createUser({
    email: input.email,
    passwordHash,
    role: "SEEKER",
    name: input.name,
  });

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: input.name,
  });
  await setSessionCookie(token);

  return NextResponse.json(
    ok({
      user: { id: user.id, email: user.email, role: user.role, name: input.name },
      needsOnboarding: !user.profile.onboardingCompleted,
    }),
    { status: 201 },
  );
});

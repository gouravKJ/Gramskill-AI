import { SignJWT, jwtVerify } from "jose";
import type { Role, SessionUser } from "@/types";

/**
 * Edge-safe JWT primitives.
 *
 * Kept separate from `session.ts` (which imports `next/headers`) so the
 * middleware, which runs on the edge runtime, can verify tokens without pulling
 * in Node-only APIs.
 */

export const SESSION_COOKIE = "gramskill_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ALG = "HS256";

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET is missing or too short. Set a 32+ character random value before deploying.",
      );
    }
    return new TextEncoder().encode("gramskill-insecure-development-secret-key");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("gramskill-ai")
    .setAudience("gramskill-app")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "gramskill-ai",
      audience: "gramskill-app",
    });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      role: (payload.role as Role) ?? "SEEKER",
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

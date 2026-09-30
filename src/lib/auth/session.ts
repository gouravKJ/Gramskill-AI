import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/jwt";
import type { SessionUser } from "@/types";

/**
 * Cookie-based sessions.
 *
 * The token itself is created/verified in `jwt.ts` (edge-safe); this module
 * only deals with the Next.js cookie store and the authorisation guards.
 */

export { SESSION_COOKIE, createSessionToken, verifySessionToken };

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Read the current session. Returns null when signed out. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this resource.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireUser();
  if (session.role !== "ADMIN") throw new ForbiddenError("Administrator access required.");
  return session;
}

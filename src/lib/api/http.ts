import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth/session";

/** Uniform API envelope so the frontend has one error contract to handle. */
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; details?: unknown };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiError>({ ok: false, error: message, details }, { status });
}

/**
 * Wrap a route handler so thrown validation/auth errors become clean JSON
 * responses instead of unhandled 500s.
 */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return fail("Please check the highlighted fields.", 422, error.flatten());
      }
      if (error instanceof UnauthorizedError) return fail(error.message, 401);
      if (error instanceof ForbiddenError) return fail(error.message, 403);
      if (error instanceof HttpError) return fail(error.message, error.status, error.details);
      console.error("[api] unhandled error", error);
      return fail("Unexpected server error. Please try again.", 500);
    }
  };
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/* -------------------------------------------------------------------------- */
/*                               Rate limiting                                */
/* -------------------------------------------------------------------------- */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __gramskillRateLimit: Map<string, Bucket> | undefined;
}

function buckets() {
  if (!globalThis.__gramskillRateLimit) globalThis.__gramskillRateLimit = new Map();
  return globalThis.__gramskillRateLimit;
}

/**
 * Simple in-process token bucket. Good enough to stop accidental hammering of
 * the auth and agent routes; replace with Redis/Upstash for multi-instance
 * deployments (documented in the README).
 */
export function rateLimit(
  key: string,
  options: { capacity: number; refillPerSecond: number } = { capacity: 20, refillPerSecond: 0.5 },
) {
  const now = Date.now();
  const bucket = buckets().get(key) ?? { tokens: options.capacity, updatedAt: now };
  const elapsedSeconds = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(options.capacity, bucket.tokens + elapsedSeconds * options.refillPerSecond);
  bucket.updatedAt = now;

  if (bucket.tokens < 1) {
    buckets().set(key, bucket);
    return { allowed: false as const, retryAfter: Math.ceil((1 - bucket.tokens) / options.refillPerSecond) };
  }

  bucket.tokens -= 1;
  buckets().set(key, bucket);
  return { allowed: true as const, remaining: Math.floor(bucket.tokens) };
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  options?: { capacity: number; refillPerSecond: number },
) {
  const result = rateLimit(clientKey(request, scope), options);
  if (!result.allowed) {
    throw new HttpError(
      `Too many requests. Please wait about ${result.retryAfter} second(s) and try again.`,
      429,
    );
  }
  return result;
}

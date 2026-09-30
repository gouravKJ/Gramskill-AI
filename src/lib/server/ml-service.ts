/**
 * Shared access to the optional Python matching service.
 *
 * Two things live here rather than in the route handlers:
 *
 * 1. **URL normalisation.** Render (and most PaaS blueprints) wire one service
 *    to another with a bare `host:port` — there is no scheme in the value. Using
 *    it directly in `fetch()` fails with an unhelpful "Failed to parse URL", so
 *    we add `http://` when it is missing.
 * 2. **The health probe.** Both `/api/health` and `/api/ml/match` need to know
 *    whether the service is actually answering, and both must degrade quietly
 *    rather than fail a request.
 */

const PROBE_TIMEOUT_MS = 1500;
const PREDICT_TIMEOUT_MS = 8000;

/** Turn a configured value into a fetchable base URL, adding a scheme if absent. */
export function normalizeServiceUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

/** The configured ML service base URL, or `null` when the feature is off. */
export function mlServiceUrl(): string | null {
  const configured = process.env.ML_SERVICE_URL;
  if (!configured) return null;
  const normalized = normalizeServiceUrl(configured);
  return normalized || null;
}

export interface MlHealth {
  status: string;
  modelKind?: string;
  semanticBackend?: string;
}

/** Ask the service how it is doing. Never throws; short timeout. */
export async function probeMlService(): Promise<MlHealth> {
  const base = mlServiceUrl();
  if (!base) return { status: "not-configured (TypeScript matcher in use)" };

  try {
    const response = await fetch(`${base}/health`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      return { status: `unreachable (HTTP ${response.status}) — TypeScript matcher in use` };
    }
    const payload = (await response.json()) as { modelKind?: string; semanticBackend?: string };
    return {
      status: `python-ml-service online (matcher: ${payload.modelKind ?? "unknown"})`,
      modelKind: payload.modelKind,
      semanticBackend: payload.semanticBackend,
    };
  } catch {
    return { status: "configured but unreachable — TypeScript matcher in use" };
  }
}

export interface MlPredictionResult {
  engine: "python-ml-service" | "typescript-matcher";
  prediction: Record<string, unknown> | null;
}

/**
 * Score one (profile, job) pair on the Python service.
 *
 * Returns `prediction: null` on any problem — a timeout, a deploy still
 * warming up, an OOM-killed free instance — so the caller falls back to the
 * in-process TypeScript matcher and the response always names the engine that
 * actually produced the number.
 */
export async function predictWithMlService(payload: {
  profile: unknown;
  job: unknown;
}): Promise<MlPredictionResult> {
  const base = mlServiceUrl();
  if (!base) return { engine: "typescript-matcher", prediction: null };

  try {
    const response = await fetch(`${base}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(PREDICT_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn("[ml] service responded", response.status);
      return { engine: "typescript-matcher", prediction: null };
    }

    return {
      engine: "python-ml-service",
      prediction: (await response.json()) as Record<string, unknown>,
    };
  } catch (error) {
    console.warn("[ml] service unavailable, using TypeScript matcher:", (error as Error).message);
    return { engine: "typescript-matcher", prediction: null };
  }
}

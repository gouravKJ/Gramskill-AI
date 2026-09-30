/**
 * Lightweight NLP utilities used for semantic profile ↔ job matching.
 *
 * The production path calls the Python FastAPI service
 * (`ml-service/app/main.py`) which uses Sentence Transformers. This module is
 * the deterministic in-process fallback so the product still works with no
 * model download, no GPU and no network — important for a rural, low-bandwidth
 * deployment and for CI.
 */

const STOPWORDS = new Set(
  `a an the and or of for to in on at with is are be as by from this that will you your we our
   job role work working candidate candidates applicant must should able good strong basic knowledge
   experience years year per month day days company team support using use help`
    .split(/\s+/)
    .filter(Boolean),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s+#.]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.]+|[.]+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
  return tf;
}

/** Inverse document frequency across a corpus — keeps rare skill terms valuable. */
export function inverseDocumentFrequency(documents: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const N = documents.length || 1;
  for (const doc of documents) {
    for (const term of new Set(doc)) idf.set(term, (idf.get(term) ?? 0) + 1);
  }
  for (const [term, df] of idf) idf.set(term, Math.log((N + 1) / (df + 1)) + 1);
  return idf;
}

export function tfidfVector(tokens: string[], idf: Map<string, number>) {
  const tf = termFrequency(tokens);
  const vec = new Map<string, number>();
  const max = Math.max(...tf.values(), 1);
  for (const [term, count] of tf) {
    vec.set(term, (count / max) * (idf.get(term) ?? 1));
  }
  return vec;
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [, v] of a) normA += v * v;
  for (const [, v] of b) normB += v * v;
  for (const [term, v] of a) {
    const other = b.get(term);
    if (other) dot += v * other;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Semantic similarity between a user profile document and a job document.
 * Returns 0..1, calibrated so ~0.15 raw cosine maps to a mid score.
 */
export function semanticSimilarity(
  profileText: string,
  jobText: string,
  corpus: string[] = [],
): number {
  const profileTokens = tokenize(profileText);
  const jobTokens = tokenize(jobText);
  if (!profileTokens.length || !jobTokens.length) return 0;
  const idf = inverseDocumentFrequency([...corpus.map(tokenize), profileTokens, jobTokens]);
  const raw = cosineSimilarity(tfidfVector(profileTokens, idf), tfidfVector(jobTokens, idf));
  return Math.max(0, Math.min(1, raw / 0.35));
}

/** Build the profile document that represents a job seeker. */
export function profileDocument(input: {
  careerGoal?: string;
  bio?: string;
  course?: string | null;
  skills: string[];
  industries?: string[];
  resumeText?: string;
}): string {
  return [
    input.careerGoal ?? "",
    input.bio ?? "",
    input.course ?? "",
    input.skills.join(" "),
    (input.industries ?? []).join(" "),
    input.resumeText ?? "",
  ].join(" ").trim();
}

/** Build the job document used for similarity + keyword extraction. */
export function jobDocument(job: {
  title: string;
  sector: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
}): string {
  return [
    job.title,
    job.sector,
    job.description,
    job.requirements.join(" "),
    job.responsibilities.join(" "),
    job.skills.join(" "),
  ].join(" ").trim();
}

/**
 * Keyword extraction used by the agent's "explain this job" tool and by the
 * resume parser. Returns the highest-signal terms from a job description.
 */
export function extractKeywords(text: string, limit = 12): string[] {
  const tokens = tokenize(text);
  const counts = termFrequency(tokens);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

/** Very small intent keyword helper reused by the agent + resume parser. */
export function containsAny(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some((n) => lower.includes(n));
}

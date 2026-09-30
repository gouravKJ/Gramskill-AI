import { SKILL_CATALOGUE, SKILL_BY_ID } from "@/lib/data/catalogue";
import type { AgentToolName } from "@/types";

/**
 * Deterministic intent detection + planning.
 *
 * This is the "agent brain" used in demo mode and as the always-available
 * fallback. It mirrors the reasoning an LLM planner performs: read the request,
 * identify the intent, choose the smallest useful tool chain, and extract
 * parameters from natural language ("within 30 km", "above ₹15,000",
 * "training for Tally").
 */

export type AgentIntent =
  | "FIND_JOBS_NEAR"
  | "FIND_JOBS_BY_SKILLS"
  | "FIND_JOBS_BY_SALARY"
  | "FIND_JOBS_FREE_TEXT"
  | "BEST_MATCH"
  | "SKILL_GAP"
  | "TRAINING"
  | "PREPARE_APPLICATION"
  | "TRACK_APPLICATIONS"
  | "UPCOMING_INTERVIEWS"
  | "JOB_DETAILS"
  | "HELP"
  | "UNKNOWN";

export interface AgentPlan {
  intent: AgentIntent;
  steps: string[];
  /** Ordered tool chain the executor will run. */
  tools: { name: AgentToolName; input: Record<string, unknown>; label: string }[];
  confidence: number;
}

const NUMBER_BEFORE_KM = /(\d+(?:\.\d+)?)\s*(?:km|kms|kilometre|kilometer|किमी)/i;
const NUMBER_AFTER_RUPEES = /(?:₹|rs\.?|inr)\s*([\d,]+)(k)?/i;
const SALARY_PHRASE = /(?:above|over|more than|at least|minimum|se\s*zyada|ज्यादा)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)(k)?/i;

function parseMoney(raw: string, k?: string) {
  const value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value)) return undefined;
  return k ? value * 1000 : value;
}

/** Detect the skill a request refers to, e.g. "training for Tally". */
export function detectSkill(text: string): { id: string; name: string } | null {
  const lower = text.toLowerCase();
  const exact = SKILL_CATALOGUE.find((s) => lower.includes(s.name.toLowerCase()));
  if (exact) return { id: exact.id, name: exact.name };
  const alias = SKILL_CATALOGUE.find((s) => s.aliases.some((a) => lower.includes(a)));
  if (alias) return { id: alias.id, name: alias.name };
  return null;
}

/** Detect which job the user is referring to by title keyword. */
export function detectJobReference(text: string): string | null {
  const lower = text.toLowerCase();
  const quoted = lower.match(/"(.*?)"/);
  return quoted ? quoted[1] : null;
}

export function detectIntent(message: string): { intent: AgentIntent; confidence: number } {
  const text = message.toLowerCase().trim();

  const has = (...needles: string[]) => needles.some((n) => text.includes(n));

  // Action intents are checked before the generic HELP trigger, otherwise
  // "help me apply for this job" would be swallowed as a capability question.
  if (has("help me apply", "apply for this", "apply with ai", "submit my application", "prepare application")) {
    return { intent: "PREPARE_APPLICATION", confidence: 0.93 };
  }
  if (has("hello", "hi ", "hey", "namaste", "नमस्ते") && text.length < 20) {
    return { intent: "HELP", confidence: 0.95 };
  }
  if (has("what can you do", "how do you work", "commands", "what can u do", "what can you help")) {
    return { intent: "HELP", confidence: 0.9 };
  }
  if (has("interview") && has("upcoming", "next", "coming", "scheduled", "when")) {
    return { intent: "UPCOMING_INTERVIEWS", confidence: 0.92 };
  }
  if (has("show my application", "my applications", "application status", "track my", "where is my application")) {
    return { intent: "TRACK_APPLICATIONS", confidence: 0.92 };
  }
  if (has("missing skill", "skill gap", "what skills am i missing", "which skills", "upskill", "kya sikhna")) {
    return { intent: "SKILL_GAP", confidence: 0.92 };
  }
  if (has("training", "course", "learn", "learning path", "sikh", "certification")) {
    return { intent: "TRAINING", confidence: 0.9 };
  }
  if (has("best match", "best suited", "which job is best", "top match", "most suitable", "best job")) {
    return { intent: "BEST_MATCH", confidence: 0.9 };
  }
  if (has("explain this job", "tell me about this job", "job details", "why this match", "why is this job")) {
    return { intent: "JOB_DETAILS", confidence: 0.85 };
  }
  if (has("near me", "near my", "close to me", "around me", "within", "distance", "paas")) {
    return { intent: "FIND_JOBS_NEAR", confidence: 0.9 };
  }
  if (has("matching my skills", "my skills", "according to my skills", "fits my skills", "skill based")) {
    return { intent: "FIND_JOBS_BY_SKILLS", confidence: 0.9 };
  }
  if (SALARY_PHRASE.test(text) || NUMBER_AFTER_RUPEES.test(text) || has("salary", "₹", "paying")) {
    return { intent: "FIND_JOBS_BY_SALARY", confidence: 0.85 };
  }
  if (has("find job", "show job", "search job", "jobs", "kasam", "naukri", "vacancy", "opportunit")) {
    return { intent: "FIND_JOBS_FREE_TEXT", confidence: 0.8 };
  }

  return { intent: "UNKNOWN", confidence: 0.3 };
}

export interface PlanInput {
  message?: string;
  /** Job currently open in the UI, used to resolve "this job". */
  activeJobId?: string | null;
  profileLocationName?: string;
}

/**
 * Turn an intent into an ordered tool chain. This is the "agentic" part: one
 * user sentence fans out into several tool calls whose results are then merged
 * into a single answer.
 */
export function plan(message: string, input: PlanInput = {}): AgentPlan {
  void input.message;
  const { intent, confidence } = detectIntent(message);
  const text = message.toLowerCase();
  const distanceMatch = text.match(NUMBER_BEFORE_KM);
  const moneyMatch = text.match(SALARY_PHRASE) ?? text.match(NUMBER_AFTER_RUPEES);
  const skill = detectSkill(message);

  const maxDistanceKm = distanceMatch ? Number(distanceMatch[1]) : undefined;
  const minSalary = moneyMatch ? parseMoney(moneyMatch[1], moneyMatch[2]) : undefined;

  switch (intent) {
    case "FIND_JOBS_NEAR":
      return {
        intent,
        confidence,
        steps: [
          "Understanding your location preference",
          "Filtering opportunities by travel distance",
          "Ranking results against your skills",
        ],
        tools: [
          {
            name: "filterJobs",
            label: `Search within ${maxDistanceKm ?? 50} km of your location`,
            input: { maxDistanceKm: maxDistanceKm ?? 50 },
          },
          { name: "analyzeSkillGap", label: "Check how well these roles fit your skills", input: {} },
        ],
      };

    case "FIND_JOBS_BY_SKILLS":
      return {
        intent,
        confidence,
        steps: [
          "Reading your skill profile",
          "Matching jobs that use those skills",
          "Scoring each match with the ranking model",
        ],
        tools: [{ name: "filterJobs", label: "Match jobs against your skills", input: {} }],
      };

    case "FIND_JOBS_BY_SALARY":
      return {
        intent,
        confidence,
        steps: [
          "Reading your salary requirement",
          "Filtering jobs by pay band",
          "Ranking the shortlist",
        ],
        tools: [
          {
            name: "filterJobs",
            label: `Find jobs paying ${minSalary ? `₹${minSalary.toLocaleString("en-IN")}+` : "the most"}`,
            input: { minSalary: minSalary ?? 15000 },
          },
        ],
      };

    case "BEST_MATCH":
      return {
        intent,
        confidence,
        steps: [
          "Scoring every open job against your profile",
          "Explaining the strongest match",
          "Listing the skills that would raise the score",
        ],
        tools: [
          { name: "filterJobs", label: "Rank all jobs by match score", input: {} },
          { name: "analyzeSkillGap", label: "Identify remaining gaps for the top match", input: {} },
        ],
      };

    case "SKILL_GAP":
      return {
        intent,
        confidence,
        steps: [
          "Comparing your skills with employer requirements",
          "Estimating learning time per gap",
          "Attaching recommended training",
        ],
        tools: [
          { name: "analyzeSkillGap", label: "Analyse skill gaps for your target role", input: {} },
          { name: "recommendTraining", label: "Map gaps to a learning path", input: {} },
        ],
      };

    case "TRAINING":
      return {
        intent,
        confidence,
        steps: [
          skill ? `Looking for ${skill.name} programmes` : "Reviewing your skill gaps",
          "Ranking training by provider rating",
          "Building an ordered learning path",
        ],
        tools: [
          {
            name: "recommendTraining",
            label: skill ? `Find training for ${skill.name}` : "Recommend training for your gaps",
            input: skill ? { skill: skill.name } : {},
          },
        ],
      };

    case "PREPARE_APPLICATION": {
      const jobId = input.activeJobId ?? (input as { jobId?: string }).jobId;
      return {
        intent,
        confidence,
        steps: [
          "Reading the job description",
          "Comparing your profile with the requirements",
          "Drafting the application for your review",
          "Waiting for your approval before anything is submitted",
        ],
        tools: [
          { name: "getJobDetails", label: "Load the job requirements", input: { jobId } },
          { name: "prepareApplication", label: "Draft the application package", input: { jobId } },
        ],
      };
    }

    case "TRACK_APPLICATIONS":
      return {
        intent,
        confidence,
        steps: ["Loading your applications", "Grouping by status", "Surfacing next actions"],
        tools: [
          { name: "trackApplication", label: "Fetch your application pipeline", input: {} },
          { name: "getApplicationStatus", label: "Check upcoming interviews and deadlines", input: {} },
        ],
      };

    case "UPCOMING_INTERVIEWS":
      return {
        intent,
        confidence,
        steps: ["Scanning applications", "Checking interview dates", "Listing preparation actions"],
        tools: [{ name: "getApplicationStatus", label: "Find interviews in the next 30 days", input: { withinDays: 30 } }],
      };

    case "JOB_DETAILS":
      return {
        intent,
        confidence,
        steps: ["Loading the job", "Explaining each match factor", "Listing skill gaps"],
        tools: [{ name: "getJobDetails", label: "Explain this job and your match", input: { jobId: input.activeJobId } }],
      };

    case "HELP":
      return {
        intent,
        confidence,
        steps: ["Listing what I can do"],
        tools: [],
      };

    default:
      return {
        intent: "FIND_JOBS_FREE_TEXT",
        confidence,
        steps: [
          "Interpreting your request as a job search",
          "Searching the full opportunity pool",
          "Ranking results for you",
        ],
        tools: [{ name: "searchJobs", label: `Search jobs for "${message}"`, input: { query: message } }],
      };
  }
}

export function describeSkill(skillId: string) {
  return SKILL_BY_ID.get(skillId)?.name ?? skillId;
}

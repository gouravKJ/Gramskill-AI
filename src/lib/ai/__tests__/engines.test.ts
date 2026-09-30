/**
 * Engine tests.
 *
 * Run with `npm test` (Node's built-in test runner through tsx). These cover the
 * behaviour that the rest of the product depends on: match ordering, skill-gap
 * ranking, learning-path construction and agent intent routing.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { DEMO_JOBS } from "@/lib/data/jobs";
import { DEMO_TRAINING } from "@/lib/data/training";
import { buildProfile, DEMO_ACCOUNTS, DEMO_PASSWORD_HASH } from "@/lib/data/users";
import { verifyPassword } from "@/lib/auth/password";
import { matchJob, matchJobs, overallMatchScore, skillOverlap } from "@/lib/ai/match-engine";
import { analyzeSkillGaps, buildLearningPath } from "@/lib/ai/skill-gap";
import { detectIntent, plan, detectSkill } from "@/lib/ai/agent/planner";
import { AGENT_TOOLS } from "@/lib/ai/agent/tools";
import { filterJobs } from "@/lib/data/job-query";

const ravi = buildProfile(DEMO_ACCOUNTS.find((a) => a.id === "usr-ravi")!);
const raviJob = DEMO_JOBS.find((j) => j.id === "job-accounts-assistant-koraput")!;

test("dataset is loadable and internally consistent", () => {
  assert.ok(DEMO_JOBS.length > 30, "expected a substantial demo job pool");
  for (const job of DEMO_JOBS) {
    assert.ok(job.skills.length > 0, `${job.id} has no skills`);
    assert.ok(new Date(job.deadline).getTime() > 0, `${job.id} has an invalid deadline`);
  }
});

test("skill overlap marks known skills as matched and unknown ones as missing", () => {
  const overlap = skillOverlap(ravi.skills, raviJob);
  assert.ok(overlap.matched.includes("sk-excel"));
  assert.ok(overlap.matched.includes("sk-accounting"));
  assert.ok(overlap.missing.includes("sk-tally"));
  // Tally is only PREFERRED on this posting, so it must not be a hard blocker.
  assert.ok(!overlap.requiredMissing.includes("sk-tally"));
  assert.ok(overlap.ratio > 0 && overlap.ratio <= 1);
});

test("a REQUIRED missing skill is reported as a hard blocker", () => {
  const strictJob = DEMO_JOBS.find((j) => j.id === "job-accounts-executive-sambalpur")!;
  const overlap = skillOverlap(ravi.skills, strictJob);
  assert.ok(overlap.requiredMissing.includes("sk-tally"), "tally is mandatory for this role");
  assert.ok(overlap.requiredMissing.includes("sk-payroll"));
});

test("match score is bounded and decomposed into weighted factors", () => {
  const match = matchJob(ravi, raviJob, { corpus: DEMO_JOBS });
  assert.ok(match.score >= 5 && match.score <= 99, `score out of range: ${match.score}`);
  const weightSum = match.factors.reduce((sum, factor) => sum + factor.weight, 0);
  assert.ok(Math.abs(weightSum - 1) < 1e-9, "factor weights must sum to 1");
  assert.equal(match.factors.length, 6);
  assert.ok(match.explanation.reasons.length > 0);
  assert.ok(match.explanation.simple.length > 20);
});

test("matches are returned in descending score order", () => {
  const matches = matchJobs(ravi, { jobs: DEMO_JOBS, corpus: DEMO_JOBS });
  assert.equal(matches.length, DEMO_JOBS.length);
  for (let i = 1; i < matches.length; i += 1) {
    assert.ok(matches[i - 1].score >= matches[i].score, "matches must be sorted by score");
  }
});

test("an accounting profile ranks accounting roles above unrelated trades", () => {
  const matches = matchJobs(ravi, { jobs: DEMO_JOBS, corpus: DEMO_JOBS });
  const rankOf = (id: string) => matches.findIndex((m) => m.job.id === id);
  assert.ok(
    rankOf("job-accounts-assistant-koraput") < rankOf("job-welder-sambalpur"),
    "accounting role should outrank welding for an accounting profile",
  );
  assert.ok(overallMatchScore(matches) > 40);
});

test("remote jobs stay reachable regardless of distance", () => {
  const remote = DEMO_JOBS.find((j) => j.workMode === "REMOTE")!;
  const match = matchJob(ravi, remote, { corpus: DEMO_JOBS });
  assert.equal(match.distanceKm, null);
  const locationFactor = match.factors.find((f) => f.key === "location")!;
  assert.ok(locationFactor.score >= 0.9, "remote roles should score highly on location");
});

test("maxDistanceKm filters out distant on-site jobs", () => {
  const near = matchJobs(ravi, { jobs: DEMO_JOBS, corpus: DEMO_JOBS, maxDistanceKm: 30 });
  assert.ok(near.length < DEMO_JOBS.length);
  for (const match of near) {
    assert.ok(match.distanceKm == null || match.distanceKm <= 30);
  }
});

test("skill gap report ranks mandatory gaps first and attaches training", () => {
  const report = analyzeSkillGaps(ravi, { jobs: DEMO_JOBS, training: DEMO_TRAINING });
  assert.ok(report.gaps.length > 0, "Ravi should have gaps for accounting roles");
  assert.ok(["REQUIRED", "PREFERRED"].includes(report.gaps[0].importance));
  assert.ok(report.gaps[0].estimatedWeeks > 0);
  assert.ok(report.gaps[0].recommendedTraining.length > 0, "each gap should map to training");
  assert.ok(report.coverage >= 0 && report.coverage <= 100);
});

test("skill gaps stay on-goal instead of leaking skills from weak matches", () => {
  // Regression: a highly-scored *off-goal* posting (e.g. a nearby fishery role
  // that matched on location) must not push its required skills into the plan.
  const report = analyzeSkillGaps(ravi, { jobs: DEMO_JOBS, training: DEMO_TRAINING });
  const gapNames = report.gaps.map((gap) => gap.skillName);
  assert.ok(!gapNames.includes("Fishery"), `off-goal skill leaked into gaps: ${gapNames.join(", ")}`);
  assert.ok(!gapNames.includes("Poultry Farming"));
  assert.ok(
    gapNames.some((name) => ["Tally Prime", "GST", "Digital Payments (UPI)", "Payroll Management"].includes(name)),
    "expected accounting-related gaps",
  );
  assert.ok(report.targetMatches.length > 0);
  // Every role the plan was computed against must be a genuine accounting/office
  // target for this persona.
  const targetIds = report.targetMatches.map((match) => match.job.id);
  assert.ok(
    targetIds.includes("job-accounts-assistant-koraput"),
    `expected the Accounts Assistant role in ${targetIds.join(", ")}`,
  );
  const fishery = DEMO_JOBS.find((job) => job.id === "job-fishery-field-assistant-nowrangpur")!;
  assert.ok(!targetIds.includes(fishery.id), "off-goal posting must not become a target role");
});

test("an explicit target job is honoured by the gap analysis", () => {
  const target = "job-accounts-executive-sambalpur";
  const report = analyzeSkillGaps(ravi, {
    jobs: DEMO_JOBS,
    training: DEMO_TRAINING,
    targetJobId: target,
  });
  assert.equal(report.targetJob?.id, target);
  assert.equal(report.targetMatches.length, 1);
  const names = report.gaps.map((gap) => gap.skillName);
  assert.ok(names.includes("Tally Prime"));
  assert.ok(names.includes("Payroll Management"));
});

test("learning path is ordered, non-empty and projects an improved score", () => {
  const report = analyzeSkillGaps(ravi, { jobs: DEMO_JOBS, training: DEMO_TRAINING });
  const path = buildLearningPath(ravi, report, DEMO_TRAINING, report.targetJob ?? raviJob);
  assert.ok(path.steps.length >= 2);
  assert.equal(path.steps[0].order, 1);
  assert.ok(path.totalWeeks > 0);
  assert.ok(path.projectedMatchScore >= matchJob(ravi, raviJob, { corpus: DEMO_JOBS }).score);
});

test("no duplicate programmes in a learning path", () => {
  const report = analyzeSkillGaps(ravi, { jobs: DEMO_JOBS, training: DEMO_TRAINING });
  const path = buildLearningPath(ravi, report, DEMO_TRAINING);
  const ids = path.steps.map((step) => step.training.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("agent intent detection routes the documented example commands", () => {
  const cases: [string, string][] = [
    ["Find accounting jobs within 30 km of my location.", "FIND_JOBS_NEAR"],
    ["Find jobs near me", "FIND_JOBS_NEAR"],
    ["Find jobs matching my skills", "FIND_JOBS_BY_SKILLS"],
    ["Show jobs above ₹15,000", "FIND_JOBS_BY_SALARY"],
    ["Which job is best matched to my skills?", "BEST_MATCH"],
    ["What skills am I missing?", "SKILL_GAP"],
    ["Find training for Tally.", "TRAINING"],
    ["Help me apply for this job.", "PREPARE_APPLICATION"],
    ["Show my applications.", "TRACK_APPLICATIONS"],
    ["Which interviews are coming up?", "UPCOMING_INTERVIEWS"],
  ];

  for (const [message, expected] of cases) {
    const { intent } = detectIntent(message);
    assert.equal(intent, expected, `"${message}" should map to ${expected} (got ${intent})`);
  }
});

test("planner extracts distance, salary and skill parameters", () => {
  const near = plan("Find accounting jobs within 30 km of my location.");
  const filterStep = near.tools.find((t) => t.name === "filterJobs")!;
  assert.equal(filterStep.input.maxDistanceKm, 30);

  const paid = plan("Show jobs above ₹15,000");
  const salaryStep = paid.tools.find((t) => t.name === "filterJobs")!;
  assert.equal(salaryStep.input.minSalary, 15000);

  assert.equal(detectSkill("Find training for Tally")?.id, "sk-tally");
});

test("application preparation always requires approval", async () => {
  const context = {
    profile: ravi,
    jobs: DEMO_JOBS,
    training: DEMO_TRAINING,
    applications: [],
  };
  const result = await AGENT_TOOLS.prepareApplication.execute(context, { jobId: raviJob.id });
  assert.equal(result.requiresApproval, true);
  assert.ok(result.pendingDetails?.coverNote, "draft should include a cover note");
});

test("demo accounts can actually sign in with the documented password", async () => {
  // Guards a real regression: the embedded hash must match every demo account's
  // plain password, otherwise the "Explore Demo" button silently breaks.
  for (const account of DEMO_ACCOUNTS) {
    assert.equal(account.plainPassword, "demo1234", `${account.email} password differs`);
  }
  assert.ok(
    await verifyPassword("demo1234", DEMO_PASSWORD_HASH),
    "DEMO_PASSWORD_HASH must be a bcrypt hash of demo1234",
  );
  assert.ok(!(await verifyPassword("wrong-password", DEMO_PASSWORD_HASH)));
});

test("filterJobs applies distance, salary and skill constraints together", () => {
  const filtered = filterJobs(
    DEMO_JOBS,
    { maxDistanceKm: 60, minSalary: 15000, skills: ["sk-excel"] },
    ravi.locationId,
  );
  assert.ok(filtered.length > 0);
  for (const job of filtered) {
    assert.ok(job.skills.some((s) => s.skillId === "sk-excel"));
    assert.ok((job.salaryMax ?? job.salaryMin ?? 0) >= 15000);
  }
});

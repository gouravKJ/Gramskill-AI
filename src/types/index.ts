/**
 * Domain types for GramSkill AI.
 *
 * These types are intentionally decoupled from the Prisma client so the
 * application can run in two modes:
 *   - `demo`     : an in-memory dataset (default, zero infrastructure)
 *   - `postgres` : the Prisma/PostgreSQL persistence layer
 * Both repositories speak the same vocabulary, so swapping the data source
 * never leaks into UI code.
 */

export type Role = "SEEKER" | "ADMIN";

export type EducationLevel =
  | "BELOW_10"
  | "CLASS_10"
  | "CLASS_12"
  | "ITI"
  | "DIPLOMA"
  | "GRADUATE"
  | "POST_GRADUATE";

export type ExperienceLevel = "FRESHER" | "ZERO_TO_ONE" | "ONE_TO_THREE" | "THREE_PLUS";

export type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "APPRENTICESHIP"
  | "INTERNSHIP"
  | "GIG";

export type WorkMode = "ONSITE" | "REMOTE" | "HYBRID" | "FIELD";

export type SkillProficiency = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type SkillImportance = "REQUIRED" | "PREFERRED" | "OPTIONAL";

export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "UNDER_REVIEW"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED";

export type OpportunitySource =
  | "PRIVATE"
  | "GOVERNMENT"
  | "APPRENTICESHIP"
  | "SKILL_DEVELOPMENT"
  | "SELF_EMPLOYMENT"
  | "LOCAL";

export type LanguageCode = "en" | "hi";

export type SkillCategory =
  | "Digital"
  | "Office & Accounts"
  | "Agriculture"
  | "Trades"
  | "Manufacturing"
  | "Retail & Services"
  | "Healthcare"
  | "Communication"
  | "Logistics"
  | "IT & Software";

export interface Location {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  isRural: boolean;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  /** Human-readable learning time estimate used by the skill-gap engine. */
  learningWeeks: number;
  /** Free-text synonyms used by the NLP matcher. */
  aliases: string[];
}

export interface UserSkill {
  skillId: string;
  proficiency: SkillProficiency;
  yearsExperience: number;
}

export interface Profile {
  userId: string;
  name: string;
  age: number | null;
  phone: string | null;
  locationId: string;
  language: LanguageCode;
  education: EducationLevel | null;
  course: string | null;
  graduationYear: number | null;
  experience: ExperienceLevel | null;
  jobTypes: JobType[];
  preferredLocationIds: string[];
  salaryExpectation: number | null;
  workModes: WorkMode[];
  industries: string[];
  careerGoal: string;
  bio: string;
  resumeText: string;
  skills: UserSkill[];
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface JobSkill {
  skillId: string;
  importance: SkillImportance;
  minProficiency: SkillProficiency;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyType: "Private" | "Government" | "NGO" | "Cooperative" | "MSME" | "Startup";
  sector: string;
  source: OpportunitySource;
  description: string;
  requirements: string[];
  responsibilities: string[];
  locationId: string;
  workMode: WorkMode;
  jobType: JobType;
  salaryMin: number | null;
  salaryMax: number | null;
  experienceRequired: ExperienceLevel;
  educationRequired: EducationLevel;
  openings: number;
  postedAt: string;
  deadline: string;
  isRuralFriendly: boolean;
  localLanguageSupport: boolean;
  skills: JobSkill[];
  contactEmail: string;
}

export interface Training {
  id: string;
  title: string;
  provider: string;
  description: string;
  durationWeeks: number;
  mode: "ONLINE" | "OFFLINE" | "HYBRID";
  language: string;
  cost: number;
  certification: string;
  rating: number;
  enrolments: number;
  skillIds: string[];
  careerPath: string;
  locationId: string | null;
}

export type TrainingStatus = "RECOMMENDED" | "ENROLLED" | "IN_PROGRESS" | "COMPLETED";

export interface UserTraining {
  id: string;
  userId: string;
  trainingId: string;
  status: TrainingStatus;
  progress: number;
  enrolledAt: string;
}

export interface ApplicationTimelineEntry {
  status: ApplicationStatus;
  at: string;
  note: string;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  interviewAt: string | null;
  nextAction: string;
  nextActionAt: string | null;
  coverNote: string;
  isDemo: boolean;
  timeline: ApplicationTimelineEntry[];
}

export interface SkillGap {
  id: string;
  userId: string;
  skillId: string;
  /** Job the gap was detected against (target role). */
  targetJobId: string | null;
  importance: SkillImportance;
  estimatedWeeks: number;
  rationale: string;
  detectedAt: string;
}

export interface MatchFactor {
  key: "skills" | "education" | "experience" | "location" | "preferences" | "semantic";
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface JobMatch {
  job: Job;
  score: number;
  factors: MatchFactor[];
  matchedSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  explanation: MatchExplanation;
  distanceKm: number | null;
}

export interface MatchExplanation {
  summary: string;
  reasons: string[];
  gaps: string[];
  suggestions: string[];
  simple: string;
}

export interface AgentToolCall {
  id: string;
  name: AgentToolName;
  label: string;
  input: Record<string, unknown>;
  status: "PENDING" | "RUNNING" | "DONE" | "ERROR" | "AWAITING_APPROVAL";
  resultSummary: string;
  durationMs: number;
}

export type AgentToolName =
  | "searchJobs"
  | "filterJobs"
  | "getJobDetails"
  | "analyzeSkillGap"
  | "recommendTraining"
  | "prepareApplication"
  | "trackApplication"
  | "getApplicationStatus";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  toolCalls?: AgentToolCall[];
  planSteps?: string[];
  jobIds?: string[];
  requiresApproval?: boolean;
  /** Pending AgentAction id awaiting user approval (application drafts). */
  pendingActionId?: string;
  /** Job the pending draft refers to. */
  pendingJobId?: string;
  quickReplies?: string[];
}

export interface AgentConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AgentMessage[];
}

export interface AgentAction {
  id: string;
  conversationId: string;
  userId: string;
  tool: AgentToolName;
  input: Record<string, unknown>;
  outputSummary: string;
  status: AgentActionContextStatus;
  requiresApproval: boolean;
  createdAt: string;
}

export type AgentActionContextStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "FAILED";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  kind: "JOB" | "APPLICATION" | "TRAINING" | "SYSTEM" | "DEADLINE";
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  profile: Profile;
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface JobFilters {
  query?: string;
  skills?: string[];
  locationIds?: string[];
  jobTypes?: JobType[];
  workModes?: WorkMode[];
  sources?: OpportunitySource[];
  minSalary?: number;
  maxDistanceKm?: number;
  education?: EducationLevel;
  sector?: string;
  ruralFriendlyOnly?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "relevance" | "salary" | "recent";
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

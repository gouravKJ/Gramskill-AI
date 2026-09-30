import { DEMO_JOBS } from "@/lib/data/jobs";
import { DEMO_TRAINING } from "@/lib/data/training";
import { DEMO_LOCATIONS, SKILL_CATALOGUE } from "@/lib/data/catalogue";
import { DEFAULT_PAGE_SIZE, filterJobs, paginate } from "@/lib/data/job-query";
import {
  DEMO_ACCOUNTS,
  DEMO_APPLICATIONS,
  DEMO_NOTIFICATIONS,
  DEMO_USER_TRAINING,
  buildUser,
} from "@/lib/data/users";
import type {
  AgentAction,
  AgentConversation,
  Application,
  ApplicationStatus,
  Job,
  JobFilters,
  Location,
  Notification,
  Paginated,
  Profile,
  Skill,
  SkillGap,
  Training,
  User,
  UserTraining,
} from "@/types";

/**
 * Data-access contract.
 *
 * Two implementations ship with the project:
 *   - `DemoRepository`   (default) — an in-memory store seeded from
 *     `src/lib/data/*`. Zero infrastructure, perfect for evaluation.
 *   - `PrismaRepository` — PostgreSQL via Prisma, selected with
 *     `DATA_SOURCE=postgres`.
 *
 * UI, API routes and the agent only ever talk to this interface.
 */
export interface Repository {
  readonly source: "demo" | "postgres";

  // identity
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  createUser(input: { email: string; passwordHash: string; role: User["role"]; name: string }): Promise<User>;

  // profile
  updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile>;

  // reference data
  listLocations(): Promise<Location[]>;
  listSkills(): Promise<Skill[]>;

  // jobs
  getJobs(filters?: JobFilters, originLocationId?: string): Promise<Paginated<Job>>;
  allJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | null>;
  upsertJob(job: Job): Promise<Job>;

  // training
  listTraining(): Promise<Training[]>;
  upsertTraining(training: Training): Promise<Training>;
  listUserTraining(userId: string): Promise<UserTraining[]>;
  setUserTraining(
    userId: string,
    trainingId: string,
    patch: Partial<Pick<UserTraining, "status" | "progress">>,
  ): Promise<UserTraining>;

  // applications
  listApplications(userId: string): Promise<Application[]>;
  getApplication(id: string): Promise<Application | null>;
  createApplication(input: {
    userId: string;
    jobId: string;
    status: ApplicationStatus;
    coverNote: string;
    nextAction: string;
  }): Promise<Application>;
  updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    note: string,
    extra?: { interviewAt?: string | null; nextAction?: string; nextActionAt?: string | null },
  ): Promise<Application | null>;

  // skill gaps
  listSkillGaps(userId: string): Promise<SkillGap[]>;
  replaceSkillGaps(userId: string, gaps: SkillGap[]): Promise<void>;

  // agent
  listConversations(userId: string): Promise<AgentConversation[]>;
  getConversation(id: string): Promise<AgentConversation | null>;
  saveConversation(conversation: AgentConversation): Promise<AgentConversation>;
  createAgentAction(action: AgentAction): Promise<AgentAction>;
  updateAgentAction(id: string, patch: Partial<AgentAction>): Promise<AgentAction | null>;
  listAgentActions(userId: string): Promise<AgentAction[]>;

  // notifications
  listNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(userId: string, id: string): Promise<void>;
}


/* -------------------------------------------------------------------------- */
/*                              Demo repository                              */
/* -------------------------------------------------------------------------- */

interface DemoStore {
  users: Map<string, User>;
  jobs: Map<string, Job>;
  training: Map<string, Training>;
  applications: Map<string, Application>;
  userTraining: Map<string, UserTraining>;
  conversations: Map<string, AgentConversation>;
  agentActions: Map<string, AgentAction>;
  notifications: Map<string, Notification>;
  skillGaps: Map<string, SkillGap[]>;
}

declare global {
  // eslint-disable-next-line no-var
  var __gramskillDemoStore: DemoStore | undefined;
}

function seedStore(): DemoStore {
  return {
    users: new Map(DEMO_ACCOUNTS.map((a) => [a.id, buildUser(a)])),
    jobs: new Map(DEMO_JOBS.map((j) => [j.id, j])),
    training: new Map(DEMO_TRAINING.map((t) => [t.id, t])),
    applications: new Map(DEMO_APPLICATIONS.map((a) => [a.id, a])),
    userTraining: new Map(DEMO_USER_TRAINING.map((ut) => [ut.id, ut])),
    conversations: new Map(),
    agentActions: new Map(),
    notifications: new Map(DEMO_NOTIFICATIONS.map((n) => [n.id, n])),
    skillGaps: new Map(),
  };
}

/** Global store so hot reloads in dev do not wipe demo state. */
function store(): DemoStore {
  if (!globalThis.__gramskillDemoStore) globalThis.__gramskillDemoStore = seedStore();
  return globalThis.__gramskillDemoStore;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// `filterJobs` and `paginate` live in `@/lib/data/job-query` so the Prisma
// repository can reuse them without a circular import. Re-exported for
// convenience across the codebase.
export { filterJobs, paginate };

class DemoRepository implements Repository {
  readonly source = "demo" as const;

  async findUserByEmail(email: string) {
    const found = [...store().users.values()].find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    return found ? clone(found) : null;
  }

  async findUserById(userId: string) {
    const found = store().users.get(userId);
    return found ? clone(found) : null;
  }

  async listUsers() {
    return clone([...store().users.values()]);
  }

  async createUser(input: { email: string; passwordHash: string; role: User["role"]; name: string }) {
    const userId = id("usr");
    const user: User = {
      id: userId,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: new Date().toISOString(),
      profile: {
        userId,
        name: input.name,
        age: null,
        phone: null,
        locationId: DEMO_LOCATIONS[0].id,
        language: "en",
        education: null,
        course: null,
        graduationYear: null,
        experience: null,
        jobTypes: [],
        preferredLocationIds: [],
        salaryExpectation: null,
        workModes: [],
        industries: [],
        careerGoal: "",
        bio: "",
        resumeText: "",
        skills: [],
        onboardingCompleted: false,
        updatedAt: new Date().toISOString(),
      },
    };
    store().users.set(userId, user);
    return clone(user);
  }

  async updateProfile(userId: string, patch: Partial<Profile>) {
    const user = store().users.get(userId);
    if (!user) throw new Error("User not found");
    user.profile = { ...user.profile, ...patch, userId, updatedAt: new Date().toISOString() };
    return clone(user.profile);
  }

  async listLocations() {
    return clone(DEMO_LOCATIONS);
  }

  async listSkills() {
    return clone(SKILL_CATALOGUE);
  }

  async getJobs(filters: JobFilters = {}, originLocationId?: string) {
    const filtered = filterJobs([...store().jobs.values()], filters, originLocationId);
    return paginate(filtered, filters.page ?? 1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  }

  async allJobs() {
    return clone([...store().jobs.values()]);
  }

  async getJob(jobId: string) {
    const job = store().jobs.get(jobId);
    return job ? clone(job) : null;
  }

  async upsertJob(job: Job) {
    store().jobs.set(job.id, clone(job));
    return clone(job);
  }

  async listTraining() {
    return clone([...store().training.values()]);
  }

  async upsertTraining(training: Training) {
    store().training.set(training.id, clone(training));
    return clone(training);
  }

  async listUserTraining(userId: string) {
    return clone([...store().userTraining.values()].filter((ut) => ut.userId === userId));
  }

  async setUserTraining(
    userId: string,
    trainingId: string,
    patch: Partial<Pick<UserTraining, "status" | "progress">>,
  ) {
    const existing = [...store().userTraining.values()].find(
      (ut) => ut.userId === userId && ut.trainingId === trainingId,
    );
    const next: UserTraining = existing
      ? { ...existing, ...patch }
      : {
          id: id("ut"),
          userId,
          trainingId,
          status: patch.status ?? "ENROLLED",
          progress: patch.progress ?? 0,
          enrolledAt: new Date().toISOString(),
        };
    store().userTraining.set(next.id, next);
    return clone(next);
  }

  async listApplications(userId: string) {
    return clone(
      [...store().applications.values()]
        .filter((a) => a.userId === userId)
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()),
    );
  }

  async getApplication(applicationId: string) {
    const app = store().applications.get(applicationId);
    return app ? clone(app) : null;
  }

  async createApplication(input: {
    userId: string;
    jobId: string;
    status: ApplicationStatus;
    coverNote: string;
    nextAction: string;
  }) {
    const existing = [...store().applications.values()].find(
      (a) => a.userId === input.userId && a.jobId === input.jobId,
    );
    if (existing) {
      existing.status = input.status;
      existing.coverNote = input.coverNote || existing.coverNote;
      existing.timeline = [
        ...existing.timeline,
        { status: input.status, at: new Date().toISOString(), note: "Status updated from the AI assistant" },
      ];
      return clone(existing);
    }

    const application: Application = {
      id: id("app"),
      userId: input.userId,
      jobId: input.jobId,
      status: input.status,
      appliedAt: new Date().toISOString(),
      interviewAt: null,
      nextAction: input.nextAction,
      nextActionAt: null,
      coverNote: input.coverNote,
      isDemo: true,
      timeline: [
        {
          status: input.status,
          at: new Date().toISOString(),
          note: input.status === "APPLIED" ? "Application submitted (demo)" : "Saved for later",
        },
      ],
    };
    store().applications.set(application.id, application);
    return clone(application);
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    note: string,
    extra?: { interviewAt?: string | null; nextAction?: string; nextActionAt?: string | null },
  ) {
    const app = store().applications.get(applicationId);
    if (!app) return null;
    app.status = status;
    app.timeline = [...app.timeline, { status, at: new Date().toISOString(), note }];
    if (extra?.interviewAt !== undefined) app.interviewAt = extra.interviewAt;
    if (extra?.nextAction) app.nextAction = extra.nextAction;
    if (extra?.nextActionAt !== undefined) app.nextActionAt = extra.nextActionAt;
    return clone(app);
  }

  async listSkillGaps(userId: string) {
    return clone(store().skillGaps.get(userId) ?? []);
  }

  async replaceSkillGaps(userId: string, gaps: SkillGap[]) {
    store().skillGaps.set(userId, clone(gaps));
  }

  async listConversations(userId: string) {
    return clone(
      [...store().conversations.values()]
        .filter((c) => c.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    );
  }

  async getConversation(conversationId: string) {
    const conversation = store().conversations.get(conversationId);
    return conversation ? clone(conversation) : null;
  }

  async saveConversation(conversation: AgentConversation) {
    store().conversations.set(conversation.id, clone(conversation));
    return clone(conversation);
  }

  async createAgentAction(action: AgentAction) {
    store().agentActions.set(action.id, clone(action));
    return clone(action);
  }

  async updateAgentAction(actionId: string, patch: Partial<AgentAction>) {
    const action = store().agentActions.get(actionId);
    if (!action) return null;
    Object.assign(action, patch);
    return clone(action);
  }

  async listAgentActions(userId: string) {
    return clone([...store().agentActions.values()].filter((a) => a.userId === userId));
  }

  async listNotifications(userId: string) {
    return clone(
      [...store().notifications.values()]
        .filter((n) => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    );
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const notification = store().notifications.get(notificationId);
    if (notification && notification.userId === userId) notification.read = true;
  }
}

/* -------------------------------------------------------------------------- */
/*                            Data-source resolution                          */
/* -------------------------------------------------------------------------- */

let cached: Repository | null = null;

/**
 * Resolve the active repository. Importing the Prisma adapter lazily keeps
 * `@prisma/client` out of the bundle entirely when running in demo mode.
 */
export async function getRepository(): Promise<Repository> {
  if (cached) return cached;
  const source = (process.env.DATA_SOURCE ?? "demo").toLowerCase();

  if (source === "postgres") {
    const { PrismaRepository } = await import("@/lib/data/prisma-repository");
    cached = new PrismaRepository();
  } else {
    cached = new DemoRepository();
  }
  return cached;
}

export function resetRepositoryCache() {
  cached = null;
}

export { DemoRepository };

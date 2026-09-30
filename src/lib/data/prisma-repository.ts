import { PrismaClient, type Prisma } from "@prisma/client";
import { DEFAULT_PAGE_SIZE, filterJobs, paginate } from "@/lib/data/job-query";
import type {
  AgentAction,
  AgentConversation,
  AgentMessage,
  AgentToolCall,
  Application,
  ApplicationStatus,
  Job,
  JobFilters,
  Location,
  Notification,
  Profile,
  Skill,
  SkillGap,
  Training,
  User,
  UserTraining,
} from "@/types";

/**
 * PostgreSQL persistence via Prisma.
 *
 * Selected with `DATA_SOURCE=postgres`. Everything here maps database rows to
 * the same domain types returned by the in-memory demo repository, so no UI or
 * agent code needs to know which one is active.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type JobRow = Prisma.JobGetPayload<{ include: { skills: true } }>;
type UserRow = Prisma.UserGetPayload<{
  include: {
    profile: { include: { preferred: true } };
    userSkills: true;
  };
}>;
type ApplicationRow = Prisma.ApplicationGetPayload<{ include: { events: true } }>;
type ConversationRow = Prisma.AgentConversationGetPayload<{ include: { messages: true } }>;
type TrainingRow = Prisma.TrainingGetPayload<{ include: { skills: true } }>;

function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    companyType: row.companyType as Job["companyType"],
    sector: row.sector,
    source: row.source,
    description: row.description,
    requirements: row.requirements,
    responsibilities: row.responsibilities,
    locationId: row.locationId,
    workMode: row.workMode,
    jobType: row.jobType,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    experienceRequired: row.experienceRequired,
    educationRequired: row.educationRequired,
    openings: row.openings,
    postedAt: row.postedAt.toISOString(),
    deadline: row.deadline.toISOString(),
    isRuralFriendly: row.isRuralFriendly,
    localLanguageSupport: row.localLanguageSupport,
    contactEmail: row.contactEmail,
    skills: row.skills.map((s) => ({
      skillId: s.skillId,
      importance: s.importance,
      minProficiency: s.minProficiency,
    })),
  };
}

function mapUser(row: UserRow): User {
  const profile = row.profile;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    profile: {
      userId: row.id,
      name: profile?.name ?? row.email.split("@")[0],
      age: profile?.age ?? null,
      phone: profile?.phone ?? null,
      locationId: profile?.locationId ?? "",
      language: (profile?.language ?? "en") as Profile["language"],
      education: profile?.education ?? null,
      course: profile?.course ?? null,
      graduationYear: profile?.graduationYear ?? null,
      experience: profile?.experience ?? null,
      jobTypes: profile?.jobTypes ?? [],
      preferredLocationIds: profile?.preferred.map((p) => p.locationId) ?? [],
      salaryExpectation: profile?.salaryExpectation ?? null,
      workModes: profile?.workModes ?? [],
      industries: profile?.industries ?? [],
      careerGoal: profile?.careerGoal ?? "",
      bio: profile?.bio ?? "",
      resumeText: profile?.resumeText ?? "",
      skills: row.userSkills.map((s) => ({
        skillId: s.skillId,
        proficiency: s.proficiency,
        yearsExperience: s.yearsExperience,
      })),
      onboardingCompleted: profile?.onboardingCompleted ?? false,
      updatedAt: (profile?.updatedAt ?? row.updatedAt).toISOString(),
    },
  };
}

function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    userId: row.userId,
    jobId: row.jobId,
    status: row.status,
    appliedAt: row.appliedAt.toISOString(),
    interviewAt: row.interviewAt?.toISOString() ?? null,
    nextAction: row.nextAction,
    nextActionAt: row.nextActionAt?.toISOString() ?? null,
    coverNote: row.coverNote,
    isDemo: row.isDemo,
    timeline: row.events
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .map((e) => ({ status: e.status, at: e.at.toISOString(), note: e.note })),
  };
}

function mapConversation(row: ConversationRow): AgentConversation {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messages: row.messages
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((m) => ({
        id: m.id,
        role: (m.role === "USER" ? "user" : m.role === "ASSISTANT" ? "assistant" : "system") as AgentMessage["role"],
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        toolCalls: (m.toolCalls as unknown as AgentToolCall[] | null) ?? undefined,
        planSteps: m.planSteps.length ? m.planSteps : undefined,
        jobIds: m.jobIds.length ? m.jobIds : undefined,
        requiresApproval: m.requiresApproval,
      })),
  };
}

function mapTraining(row: TrainingRow): Training {
  return {
    id: row.id,
    title: row.title,
    provider: row.provider,
    description: row.description,
    durationWeeks: row.durationWeeks,
    mode: row.mode,
    language: row.language,
    cost: row.cost,
    certification: row.certification,
    rating: row.rating,
    enrolments: row.enrolments,
    skillIds: row.skills.map((s) => s.skillId),
    careerPath: row.careerPath,
    locationId: row.locationId,
  };
}

export class PrismaRepository {
  readonly source = "postgres" as const;

  /* ------------------------------- identity ------------------------------ */

  async findUserByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { profile: { include: { preferred: true } }, userSkills: true },
    });
    return row ? mapUser(row) : null;
  }

  async findUserById(userId: string): Promise<User | null> {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { preferred: true } }, userSkills: true },
    });
    return row ? mapUser(row) : null;
  }

  async listUsers(): Promise<User[]> {
    const rows = await prisma.user.findMany({
      include: { profile: { include: { preferred: true } }, userSkills: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapUser);
  }

  async createUser(input: { email: string; passwordHash: string; role: User["role"]; name: string }) {
    const created = await prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        profile: {
          create: {
            name: input.name,
            locationId: await this.defaultLocationId(),
          },
        },
      },
      include: { profile: { include: { preferred: true } }, userSkills: true },
    });
    return mapUser(created);
  }

  /* -------------------------------- profile ------------------------------ */

  async updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
    const data: Prisma.ProfileUncheckedUpdateInput = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.age !== undefined) data.age = patch.age;
    if (patch.phone !== undefined) data.phone = patch.phone;
    if (patch.language !== undefined) data.language = patch.language;
    if (patch.locationId !== undefined) data.locationId = patch.locationId;
    if (patch.education !== undefined) data.education = patch.education;
    if (patch.course !== undefined) data.course = patch.course;
    if (patch.graduationYear !== undefined) data.graduationYear = patch.graduationYear;
    if (patch.experience !== undefined) data.experience = patch.experience;
    if (patch.jobTypes !== undefined) data.jobTypes = patch.jobTypes;
    if (patch.workModes !== undefined) data.workModes = patch.workModes;
    if (patch.industries !== undefined) data.industries = patch.industries;
    if (patch.salaryExpectation !== undefined) data.salaryExpectation = patch.salaryExpectation;
    if (patch.careerGoal !== undefined) data.careerGoal = patch.careerGoal;
    if (patch.bio !== undefined) data.bio = patch.bio;
    if (patch.resumeText !== undefined) data.resumeText = patch.resumeText;
    if (patch.onboardingCompleted !== undefined) data.onboardingCompleted = patch.onboardingCompleted;

    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        name: patch.name ?? "New seeker",
        locationId: patch.locationId ?? (await this.defaultLocationId()),
        ...data,
      } as Prisma.ProfileUncheckedCreateInput,
      update: data,
    });

    if (patch.preferredLocationIds) {
      await prisma.profilePreferredLocation.deleteMany({ where: { profile: { userId } } });
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (profile) {
        await prisma.profilePreferredLocation.createMany({
          data: patch.preferredLocationIds.map((locationId) => ({ profileId: profile.id, locationId })),
          skipDuplicates: true,
        });
      }
    }

    if (patch.skills) {
      await prisma.userSkill.deleteMany({ where: { userId } });
      if (patch.skills.length) {
        await prisma.userSkill.createMany({
          data: patch.skills.map((s) => ({
            userId,
            skillId: s.skillId,
            proficiency: s.proficiency,
            yearsExperience: s.yearsExperience,
          })),
          skipDuplicates: true,
        });
      }
    }

    const user = await this.findUserById(userId);
    if (!user) throw new Error("Profile not found after update");
    return user.profile;
  }

  private async defaultLocationId() {
    const location = await prisma.location.findFirst({ orderBy: { id: "asc" } });
    if (!location) throw new Error("No locations seeded. Run `npm run db:seed`.");
    return location.id;
  }

  /* ----------------------------- reference data -------------------------- */

  async listLocations(): Promise<Location[]> {
    const rows = await prisma.location.findMany({ orderBy: { name: "asc" } });
    return rows.map((l) => ({ ...l }));
  }

  async listSkills(): Promise<Skill[]> {
    const rows = await prisma.skill.findMany({ orderBy: { name: "asc" } });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category as Skill["category"],
      learningWeeks: s.learningWeeks,
      aliases: s.aliases,
    }));
  }

  /* ---------------------------------- jobs ------------------------------- */

  async getJobs(filters: JobFilters = {}, originLocationId?: string) {
    // Filtering is done in-process so the exact same rules (distance decay,
    // education ordering, skill OR-matching) apply to demo and Postgres data.
    const jobs = await this.allJobs();
    const filtered = filterJobs(jobs, filters, originLocationId);
    return paginate(filtered, filters.page ?? 1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  }

  async allJobs(): Promise<Job[]> {
    const rows = await prisma.job.findMany({ where: { isActive: true }, include: { skills: true } });
    return rows.map(mapJob);
  }

  async getJob(jobId: string): Promise<Job | null> {
    const row = await prisma.job.findUnique({ where: { id: jobId }, include: { skills: true } });
    return row ? mapJob(row) : null;
  }

  async upsertJob(job: Job): Promise<Job> {
    const data = {
      title: job.title,
      company: job.company,
      companyType: job.companyType,
      sector: job.sector,
      source: job.source,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      locationId: job.locationId,
      workMode: job.workMode,
      jobType: job.jobType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      experienceRequired: job.experienceRequired,
      educationRequired: job.educationRequired,
      openings: job.openings,
      deadline: new Date(job.deadline),
      isRuralFriendly: job.isRuralFriendly,
      localLanguageSupport: job.localLanguageSupport,
      contactEmail: job.contactEmail,
    };
    const row = await prisma.job.upsert({
      where: { id: job.id },
      create: { id: job.id, ...data },
      update: data,
      include: { skills: true },
    });
    await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });
    if (job.skills.length) {
      await prisma.jobSkill.createMany({
        data: job.skills.map((s) => ({
          jobId: job.id,
          skillId: s.skillId,
          importance: s.importance,
          minProficiency: s.minProficiency,
        })),
        skipDuplicates: true,
      });
    }
    const refreshed = await prisma.job.findUnique({ where: { id: row.id }, include: { skills: true } });
    return mapJob(refreshed!);
  }

  /* -------------------------------- training ----------------------------- */

  async listTraining(): Promise<Training[]> {
    const rows = await prisma.training.findMany({ include: { skills: true } });
    return rows.map(mapTraining);
  }

  async upsertTraining(training: Training): Promise<Training> {
    const data = {
      title: training.title,
      provider: training.provider,
      description: training.description,
      durationWeeks: training.durationWeeks,
      mode: training.mode,
      language: training.language,
      cost: training.cost,
      certification: training.certification,
      rating: training.rating,
      enrolments: training.enrolments,
      careerPath: training.careerPath,
      locationId: training.locationId,
    };
    const row = await prisma.training.upsert({
      where: { id: training.id },
      create: { id: training.id, ...data },
      update: data,
      include: { skills: true },
    });
    await prisma.trainingSkill.deleteMany({ where: { trainingId: training.id } });
    if (training.skillIds.length) {
      await prisma.trainingSkill.createMany({
        data: training.skillIds.map((skillId) => ({ trainingId: training.id, skillId })),
        skipDuplicates: true,
      });
    }
    const refreshed = await prisma.training.findUnique({ where: { id: row.id }, include: { skills: true } });
    return mapTraining(refreshed!);
  }

  async listUserTraining(userId: string): Promise<UserTraining[]> {
    const rows = await prisma.userTraining.findMany({ where: { userId } });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      trainingId: r.trainingId,
      status: r.status,
      progress: r.progress,
      enrolledAt: r.enrolledAt.toISOString(),
    }));
  }

  async setUserTraining(
    userId: string,
    trainingId: string,
    patch: Partial<Pick<UserTraining, "status" | "progress">>,
  ): Promise<UserTraining> {
    const row = await prisma.userTraining.upsert({
      where: { userId_trainingId: { userId, trainingId } },
      create: {
        userId,
        trainingId,
        status: patch.status ?? "ENROLLED",
        progress: patch.progress ?? 0,
      },
      update: { ...patch },
    });
    return {
      id: row.id,
      userId: row.userId,
      trainingId: row.trainingId,
      status: row.status,
      progress: row.progress,
      enrolledAt: row.enrolledAt.toISOString(),
    };
  }

  /* ------------------------------ applications --------------------------- */

  async listApplications(userId: string): Promise<Application[]> {
    const rows = await prisma.application.findMany({
      where: { userId },
      include: { events: true },
      orderBy: { appliedAt: "desc" },
    });
    return rows.map(mapApplication);
  }

  async getApplication(applicationId: string): Promise<Application | null> {
    const row = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { events: true },
    });
    return row ? mapApplication(row) : null;
  }

  async createApplication(input: {
    userId: string;
    jobId: string;
    status: ApplicationStatus;
    coverNote: string;
    nextAction: string;
  }): Promise<Application> {
    const row = await prisma.application.upsert({
      where: { userId_jobId: { userId: input.userId, jobId: input.jobId } },
      create: {
        userId: input.userId,
        jobId: input.jobId,
        status: input.status,
        coverNote: input.coverNote,
        nextAction: input.nextAction,
        events: {
          create: [{ status: input.status, note: "Created from GramSkill AI" }],
        },
      },
      update: {
        status: input.status,
        coverNote: input.coverNote || undefined,
        events: { create: [{ status: input.status, note: "Status updated" }] },
      },
      include: { events: true },
    });
    return mapApplication(row);
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    note: string,
    extra?: { interviewAt?: string | null; nextAction?: string; nextActionAt?: string | null },
  ): Promise<Application | null> {
    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) return null;
    const row = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        interviewAt: extra?.interviewAt ? new Date(extra.interviewAt) : undefined,
        nextAction: extra?.nextAction,
        nextActionAt: extra?.nextActionAt ? new Date(extra.nextActionAt) : undefined,
        events: { create: [{ status, note }] },
      },
      include: { events: true },
    });
    return mapApplication(row);
  }

  /* ------------------------------- skill gaps ---------------------------- */

  async listSkillGaps(userId: string): Promise<SkillGap[]> {
    const rows = await prisma.skillGap.findMany({ where: { userId } });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      skillId: r.skillId,
      targetJobId: r.targetJobId,
      importance: r.importance,
      estimatedWeeks: r.estimatedWeeks,
      rationale: r.rationale,
      detectedAt: r.detectedAt.toISOString(),
    }));
  }

  async replaceSkillGaps(userId: string, gaps: SkillGap[]): Promise<void> {
    await prisma.skillGap.deleteMany({ where: { userId } });
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const skillIds = new Set((await prisma.skill.findMany({ select: { id: true } })).map((s) => s.id));
    const valid = gaps.filter((g) => skillIds.has(g.skillId));
    if (!valid.length) return;
    await prisma.skillGap.createMany({
      data: valid.map((g) => ({
        userId,
        profileId: profile?.id,
        skillId: g.skillId,
        targetJobId: g.targetJobId ?? undefined,
        importance: g.importance,
        estimatedWeeks: g.estimatedWeeks,
        rationale: g.rationale,
      })),
      skipDuplicates: true,
    });
  }

  /* ---------------------------------- agent ------------------------------ */

  async listConversations(userId: string): Promise<AgentConversation[]> {
    const rows = await prisma.agentConversation.findMany({
      where: { userId },
      include: { messages: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapConversation);
  }

  async getConversation(conversationId: string): Promise<AgentConversation | null> {
    const row = await prisma.agentConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });
    return row ? mapConversation(row) : null;
  }

  async saveConversation(conversation: AgentConversation): Promise<AgentConversation> {
    await prisma.agentConversation.upsert({
      where: { id: conversation.id },
      create: {
        id: conversation.id,
        userId: conversation.userId,
        title: conversation.title,
      },
      update: { title: conversation.title, updatedAt: new Date() },
    });

    await prisma.agentMessage.deleteMany({ where: { conversationId: conversation.id } });
    for (const message of conversation.messages) {
      await prisma.agentMessage.create({
        data: {
          id: message.id,
          conversationId: conversation.id,
          role: message.role === "user" ? "USER" : message.role === "assistant" ? "ASSISTANT" : "SYSTEM",
          content: message.content,
          toolCalls: (message.toolCalls ?? undefined) as unknown as Prisma.InputJsonValue,
          planSteps: message.planSteps ?? [],
          jobIds: message.jobIds ?? [],
          requiresApproval: message.requiresApproval ?? false,
          createdAt: new Date(message.createdAt),
        },
      });
    }

    const saved = await this.getConversation(conversation.id);
    return saved ?? conversation;
  }

  async createAgentAction(action: AgentAction): Promise<AgentAction> {
    const row = await prisma.agentAction.create({
      data: {
        id: action.id,
        conversationId: action.conversationId,
        userId: action.userId,
        tool: action.tool,
        input: action.input as Prisma.InputJsonValue,
        outputSummary: action.outputSummary,
        status: action.status,
        requiresApproval: action.requiresApproval,
      },
    });
    return {
      id: row.id,
      conversationId: row.conversationId,
      userId: row.userId,
      tool: row.tool,
      input: row.input as Record<string, unknown>,
      outputSummary: row.outputSummary,
      status: row.status,
      requiresApproval: row.requiresApproval,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateAgentAction(actionId: string, patch: Partial<AgentAction>): Promise<AgentAction | null> {
    const row = await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: patch.status,
        outputSummary: patch.outputSummary,
        resolvedAt: patch.status && patch.status !== "PENDING_APPROVAL" ? new Date() : undefined,
      },
    });
    return {
      id: row.id,
      conversationId: row.conversationId,
      userId: row.userId,
      tool: row.tool,
      input: row.input as Record<string, unknown>,
      outputSummary: row.outputSummary,
      status: row.status,
      requiresApproval: row.requiresApproval,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listAgentActions(userId: string): Promise<AgentAction[]> {
    const rows = await prisma.agentAction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      userId: row.userId,
      tool: row.tool,
      input: row.input as Record<string, unknown>,
      outputSummary: row.outputSummary,
      status: row.status,
      requiresApproval: row.requiresApproval,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  /* ----------------------------- notifications --------------------------- */

  async listNotifications(userId: string): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      body: r.body,
      kind: r.kind,
      href: r.href,
      read: r.read,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }
}

import { z } from "zod";

/**
 * One source of truth for validation: the same schemas drive React Hook Form
 * on the client and request parsing on the server.
 */

export const educationEnum = z.enum([
  "BELOW_10",
  "CLASS_10",
  "CLASS_12",
  "ITI",
  "DIPLOMA",
  "GRADUATE",
  "POST_GRADUATE",
]);

export const experienceEnum = z.enum(["FRESHER", "ZERO_TO_ONE", "ONE_TO_THREE", "THREE_PLUS"]);

export const jobTypeEnum = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "APPRENTICESHIP",
  "INTERNSHIP",
  "GIG",
]);

export const workModeEnum = z.enum(["ONSITE", "REMOTE", "HYBRID", "FIELD"]);

export const proficiencyEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const applicationStatusEnum = z.enum([
  "SAVED",
  "APPLIED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
]);

export const sourceEnum = z.enum([
  "PRIVATE",
  "GOVERNMENT",
  "APPRENTICESHIP",
  "SKILL_DEVELOPMENT",
  "SELF_EMPLOYMENT",
  "LOCAL",
]);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password is too long.")
    .regex(/[a-zA-Z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export const skillSelectionSchema = z.object({
  skillId: z.string().min(1),
  proficiency: proficiencyEnum.default("BEGINNER"),
  yearsExperience: z.number().min(0).max(50).default(0),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  age: z.number().int().min(14, "You must be at least 14.").max(70).nullable().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{0,16}$/, "Enter a valid phone number.")
    .nullable()
    .optional(),
  locationId: z.string().min(1).optional(),
  language: z.enum(["en", "hi"]).optional(),
  education: educationEnum.nullable().optional(),
  course: z.string().trim().max(120).nullable().optional(),
  graduationYear: z
    .number()
    .int()
    .min(1970)
    .max(new Date().getFullYear() + 6)
    .nullable()
    .optional(),
  experience: experienceEnum.nullable().optional(),
  jobTypes: z.array(jobTypeEnum).optional(),
  preferredLocationIds: z.array(z.string()).max(8, "Choose up to 8 preferred locations.").optional(),
  salaryExpectation: z.number().int().min(0).max(1_000_000).nullable().optional(),
  workModes: z.array(workModeEnum).optional(),
  industries: z.array(z.string().max(60)).max(10).optional(),
  careerGoal: z.string().trim().max(400).optional(),
  bio: z.string().trim().max(1200).optional(),
  resumeText: z.string().trim().max(8000).optional(),
  skills: z.array(skillSelectionSchema).max(40).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const jobFiltersSchema = z.object({
  query: z.string().trim().max(80).optional(),
  skills: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(),
  jobTypes: z.array(jobTypeEnum).optional(),
  workModes: z.array(workModeEnum).optional(),
  sources: z.array(sourceEnum).optional(),
  minSalary: z.number().int().min(0).optional(),
  maxDistanceKm: z.number().int().min(1).max(1000).optional(),
  education: educationEnum.optional(),
  sector: z.string().optional(),
  ruralFriendlyOnly: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
  sort: z.enum(["relevance", "salary", "recent"]).optional(),
});

export const matchRequestSchema = z.object({
  jobIds: z.array(z.string()).optional(),
  filters: jobFiltersSchema.optional(),
  limit: z.number().int().min(1).max(60).default(20),
  minScore: z.number().int().min(0).max(100).optional(),
});

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, "Choose a job first."),
  status: applicationStatusEnum.default("APPLIED"),
  coverNote: z.string().trim().max(1200).default(""),
  nextAction: z.string().trim().max(200).default(""),
  /** Explicit user consent is required before an application leaves the device. */
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "Please review and confirm the application first." }),
  }),
});

export const updateApplicationSchema = z.object({
  status: applicationStatusEnum,
  note: z.string().trim().max(300).default(""),
  interviewAt: z.string().datetime().nullable().optional(),
  nextAction: z.string().trim().max(200).optional(),
  nextActionAt: z.string().datetime().nullable().optional(),
});

export const agentChatSchema = z.object({
  message: z.string().trim().min(1, "Type a message first.").max(600),
  conversationId: z.string().optional(),
  /** Tools that may only run after explicit user approval. */
  approveActionId: z.string().optional(),
  rejectActionId: z.string().optional(),
  context: z
    .object({
      jobId: z.string().optional(),
      simpleLanguage: z.boolean().optional(),
      language: z.enum(["en", "hi"]).optional(),
    })
    .optional(),
});

export const jobUpsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(120),
  company: z.string().trim().min(2).max(120),
  companyType: z.enum(["Private", "Government", "NGO", "Cooperative", "MSME", "Startup"]),
  sector: z.string().trim().min(2).max(80),
  source: sourceEnum,
  description: z.string().trim().min(20).max(2000),
  requirements: z.array(z.string().trim().min(2)).min(1).max(12),
  responsibilities: z.array(z.string().trim().min(2)).min(1).max(12),
  locationId: z.string().min(1),
  workMode: workModeEnum,
  jobType: jobTypeEnum,
  salaryMin: z.number().int().min(0).nullable(),
  salaryMax: z.number().int().min(0).nullable(),
  experienceRequired: experienceEnum,
  educationRequired: educationEnum,
  openings: z.number().int().min(1).max(1000).default(1),
  deadlineInDays: z.number().int().min(1).max(180).default(30),
  isRuralFriendly: z.boolean().default(true),
  localLanguageSupport: z.boolean().default(true),
  contactEmail: z.string().email(),
  skills: z.array(z.object({ skillId: z.string(), importance: z.enum(["REQUIRED", "PREFERRED", "OPTIONAL"]) })).min(1),
});

export const trainingUpsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(120),
  provider: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(2000),
  durationWeeks: z.number().int().min(1).max(104),
  mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  language: z.string().trim().min(2).max(80),
  cost: z.number().int().min(0).max(100_000),
  certification: z.string().trim().max(120).default(""),
  careerPath: z.string().trim().max(120).default(""),
  locationId: z.string().nullable().default(null),
  skillIds: z.array(z.string()).min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
export type AgentChatInput = z.infer<typeof agentChatSchema>;
export type JobUpsertInput = z.infer<typeof jobUpsertSchema>;
export type TrainingUpsertInput = z.infer<typeof trainingUpsertSchema>;

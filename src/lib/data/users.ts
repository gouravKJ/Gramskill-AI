import type { Application, ApplicationStatus, Notification, Profile, User, UserTraining } from "@/types";

/**
 * DEMO accounts.
 * `Ravi Kumar` is the persona used by the "Explore Demo" button; the other
 * accounts exist so the admin dashboard and AI insights have a real dataset
 * to aggregate instead of invented numbers.
 *
 * Passwords are hashed at runtime by `src/lib/data/repository.ts` when the
 * Postgres seed runs. In demo mode the plain credential below is verified
 * against a pre-computed bcrypt hash of "demo1234".
 */

export interface DemoAccount {
  id: string;
  email: string;
  role: User["role"];
  plainPassword: string;
  name: string;
  age: number | null;
  locationId: string;
  language: "en" | "hi";
  education: Profile["education"];
  course: string | null;
  graduationYear: number | null;
  experience: Profile["experience"];
  jobTypes: Profile["jobTypes"];
  preferredLocationIds: string[];
  salaryExpectation: number | null;
  workModes: Profile["workModes"];
  industries: string[];
  careerGoal: string;
  bio: string;
  skills: { skillId: string; proficiency: Profile["skills"][number]["proficiency"]; yearsExperience: number }[];
  onboardingCompleted: boolean;
}

/**
 * bcrypt (cost 10) hash of "demo1234", verified at build time so the demo
 * sign-in always works. The Prisma seed re-hashes at runtime for real DBs, so
 * this constant is only used by the in-memory demo repository.
 */
export const DEMO_PASSWORD_HASH = "$2a$10$nPloCTXFZPhgRvefCcpUAeS4DSFmA0qqvQGPfwD18ho8Jqi2iJgTm";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "usr-ravi",
    email: "ravi@gramskill.demo",
    role: "SEEKER",
    plainPassword: "demo1234",
    name: "Ravi Kumar",
    age: 22,
    locationId: "loc-koraput",
    language: "en",
    education: "DIPLOMA",
    course: "Diploma in Commerce",
    graduationYear: 2024,
    experience: "FRESHER",
    jobTypes: ["FULL_TIME", "INTERNSHIP", "APPRENTICESHIP"],
    preferredLocationIds: ["loc-koraput", "loc-rayagada", "loc-remote"],
    salaryExpectation: 15000,
    workModes: ["ONSITE", "HYBRID", "REMOTE"],
    industries: ["Accounting & Finance", "Government Administration", "Retail & Services"],
    careerGoal: "I want to become an Accounts Assistant in a company near my village.",
    bio: "Diploma holder from Koraput looking for my first accounting job. Comfortable with Excel and bookkeeping basics, keen to learn Tally and GST.",
    skills: [
      { skillId: "sk-excel", proficiency: "INTERMEDIATE", yearsExperience: 2 },
      { skillId: "sk-accounting", proficiency: "INTERMEDIATE", yearsExperience: 1 },
      { skillId: "sk-communication", proficiency: "INTERMEDIATE", yearsExperience: 2 },
      { skillId: "sk-ms-office", proficiency: "BEGINNER", yearsExperience: 1 },
      { skillId: "sk-computer-basics", proficiency: "INTERMEDIATE", yearsExperience: 3 },
      { skillId: "sk-odiya", proficiency: "ADVANCED", yearsExperience: 10 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-admin",
    email: "admin@gramskill.demo",
    role: "ADMIN",
    plainPassword: "demo1234",
    name: "District Programme Officer",
    age: 38,
    locationId: "loc-bhubaneswar",
    language: "en",
    education: "POST_GRADUATE",
    course: "MA Public Policy",
    graduationYear: 2012,
    experience: "THREE_PLUS",
    jobTypes: ["FULL_TIME"],
    preferredLocationIds: ["loc-bhubaneswar"],
    salaryExpectation: null,
    workModes: ["ONSITE"],
    industries: ["Government Administration"],
    careerGoal: "Monitor skilling outcomes across the district.",
    bio: "Administrator account for the GramSkill AI demo.",
    skills: [
      { skillId: "sk-excel", proficiency: "ADVANCED", yearsExperience: 10 },
      { skillId: "sk-leadership", proficiency: "ADVANCED", yearsExperience: 12 },
      { skillId: "sk-communication", proficiency: "ADVANCED", yearsExperience: 12 },
    ],
    onboardingCompleted: true,
  },
  // --- Additional demo job seekers (power the admin analytics) -------------
  {
    id: "usr-sita", email: "sita@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Sita Majhi", age: 24, locationId: "loc-koraput", language: "hi",
    education: "GRADUATE", course: "B.Com", graduationYear: 2023, experience: "ZERO_TO_ONE",
    jobTypes: ["FULL_TIME"], preferredLocationIds: ["loc-koraput"], salaryExpectation: 18000,
    workModes: ["ONSITE"], industries: ["Accounting & Finance"],
    careerGoal: "Become an Accounts Executive with GST expertise.",
    bio: "B.Com graduate, working part-time at a shop, wants payroll and GST skills.",
    skills: [
      { skillId: "sk-accounting", proficiency: "ADVANCED", yearsExperience: 2 },
      { skillId: "sk-excel", proficiency: "INTERMEDIATE", yearsExperience: 2 },
      { skillId: "sk-communication", proficiency: "INTERMEDIATE", yearsExperience: 2 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-bikash", email: "bikash@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Bikash Pradhan", age: 21, locationId: "loc-rayagada", language: "en",
    education: "ITI", course: "Electrician", graduationYear: 2024, experience: "FRESHER",
    jobTypes: ["APPRENTICESHIP", "FULL_TIME"], preferredLocationIds: ["loc-rayagada", "loc-koraput"],
    salaryExpectation: 14000, workModes: ["ONSITE", "FIELD"], industries: ["Manufacturing", "Renewable Energy"],
    careerGoal: "Get an apprenticeship in solar installation.",
    bio: "ITI electrician looking for solar or industrial wiring work.",
    skills: [
      { skillId: "sk-electrical", proficiency: "INTERMEDIATE", yearsExperience: 1 },
      { skillId: "sk-solar-installation", proficiency: "BEGINNER", yearsExperience: 0 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-laxmi", email: "laxmi@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Laxmi Sahu", age: 27, locationId: "loc-sambalpur", language: "hi",
    education: "CLASS_12", course: "Arts", graduationYear: 2018, experience: "ONE_TO_THREE",
    jobTypes: ["FULL_TIME", "PART_TIME"], preferredLocationIds: ["loc-sambalpur"], salaryExpectation: 13000,
    workModes: ["ONSITE"], industries: ["Textiles"],
    careerGoal: "Grow into a tailoring supervisor role.",
    bio: "Experienced tailor with three years in a garment unit.",
    skills: [
      { skillId: "sk-tailoring", proficiency: "ADVANCED", yearsExperience: 4 },
      { skillId: "sk-handicraft", proficiency: "INTERMEDIATE", yearsExperience: 3 },
      { skillId: "sk-communication", proficiency: "BEGINNER", yearsExperience: 3 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-anil", email: "anil@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Anil Nayak", age: 23, locationId: "loc-bhubaneswar", language: "en",
    education: "GRADUATE", course: "B.Sc Computer Science", graduationYear: 2024, experience: "FRESHER",
    jobTypes: ["FULL_TIME", "INTERNSHIP"], preferredLocationIds: ["loc-bhubaneswar", "loc-remote"],
    salaryExpectation: 25000, workModes: ["REMOTE", "HYBRID"], industries: ["IT & Software"],
    careerGoal: "Start a career as a junior web developer.",
    bio: "B.Sc CS graduate with React portfolio projects.",
    skills: [
      { skillId: "sk-web-development", proficiency: "INTERMEDIATE", yearsExperience: 2 },
      { skillId: "sk-programming", proficiency: "INTERMEDIATE", yearsExperience: 2 },
      { skillId: "sk-database", proficiency: "BEGINNER", yearsExperience: 1 },
      { skillId: "sk-english", proficiency: "INTERMEDIATE", yearsExperience: 4 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-mamata", email: "mamata@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Mamata Behera", age: 25, locationId: "loc-kalahandi", language: "hi",
    education: "CLASS_12", course: "Science", graduationYear: 2020, experience: "ZERO_TO_ONE",
    jobTypes: ["FULL_TIME"], preferredLocationIds: ["loc-kalahandi"], salaryExpectation: 14000,
    workModes: ["ONSITE", "FIELD"], industries: ["Animal Husbandry"],
    careerGoal: "Work with the dairy cooperative as an extension officer.",
    bio: "From a dairy farming family, wants a formal role with the cooperative.",
    skills: [
      { skillId: "sk-dairy", proficiency: "INTERMEDIATE", yearsExperience: 3 },
      { skillId: "sk-farming", proficiency: "INTERMEDIATE", yearsExperience: 4 },
      { skillId: "sk-communication", proficiency: "INTERMEDIATE", yearsExperience: 3 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-deepak", email: "deepak@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Deepak Naik", age: 29, locationId: "loc-bolangir", language: "hi",
    education: "CLASS_10", course: null, graduationYear: 2013, experience: "THREE_PLUS",
    jobTypes: ["FULL_TIME", "CONTRACT"], preferredLocationIds: ["loc-bolangir", "loc-bhubaneswar"],
    salaryExpectation: 20000, workModes: ["ONSITE", "FIELD"], industries: ["Construction & Infrastructure"],
    careerGoal: "Become a site supervisor for rural housing projects.",
    bio: "Ten years of masonry work, wants supervisor responsibility.",
    skills: [
      { skillId: "sk-masonry", proficiency: "ADVANCED", yearsExperience: 10 },
      { skillId: "sk-leadership", proficiency: "INTERMEDIATE", yearsExperience: 4 },
      { skillId: "sk-plumbing", proficiency: "INTERMEDIATE", yearsExperience: 5 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-priya", email: "priya@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Priya Rani Das", age: 22, locationId: "loc-gajapati", language: "en",
    education: "GRADUATE", course: "B.A. English", graduationYear: 2025, experience: "FRESHER",
    jobTypes: ["PART_TIME", "GIG"], preferredLocationIds: ["loc-remote", "loc-gajapati"],
    salaryExpectation: 12000, workModes: ["REMOTE"], industries: ["Business Process Outsourcing"],
    careerGoal: "Work from home as a customer support executive.",
    bio: "Fresh graduate with good spoken Hindi and English.",
    skills: [
      { skillId: "sk-english", proficiency: "INTERMEDIATE", yearsExperience: 5 },
      { skillId: "sk-communication", proficiency: "INTERMEDIATE", yearsExperience: 3 },
      { skillId: "sk-computer-basics", proficiency: "BEGINNER", yearsExperience: 1 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-suresh", email: "suresh@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Suresh Kandulna", age: 26, locationId: "loc-ranchi", language: "hi",
    education: "GRADUATE", course: "BCA", graduationYear: 2021, experience: "ONE_TO_THREE",
    jobTypes: ["FULL_TIME", "APPRENTICESHIP"], preferredLocationIds: ["loc-ranchi"], salaryExpectation: 22000,
    workModes: ["HYBRID", "ONSITE"], industries: ["IT & Software"],
    careerGoal: "Move into cyber security operations.",
    bio: "BCA graduate with networking interest, currently doing data entry.",
    skills: [
      { skillId: "sk-data-entry", proficiency: "ADVANCED", yearsExperience: 3 },
      { skillId: "sk-computer-basics", proficiency: "ADVANCED", yearsExperience: 5 },
      { skillId: "sk-cyber-security", proficiency: "BEGINNER", yearsExperience: 0 },
      { skillId: "sk-excel", proficiency: "INTERMEDIATE", yearsExperience: 3 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-kabita", email: "kabita@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Kabita Singh", age: 30, locationId: "loc-kandhamal", language: "hi",
    education: "CLASS_10", course: null, graduationYear: 2012, experience: "THREE_PLUS",
    jobTypes: ["GIG", "PART_TIME"], preferredLocationIds: ["loc-kandhamal"], salaryExpectation: 10000,
    workModes: ["ONSITE"], industries: ["Textiles"],
    careerGoal: "Expand my handloom work into an online craft business.",
    bio: "Traditional weaver from Kandhamal, member of a craft collective.",
    skills: [
      { skillId: "sk-handicraft", proficiency: "ADVANCED", yearsExperience: 12 },
      { skillId: "sk-marketing", proficiency: "BEGINNER", yearsExperience: 1 },
      { skillId: "sk-digital-payments", proficiency: "BEGINNER", yearsExperience: 1 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-rahul", email: "rahul@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Rahul Meher", age: 20, locationId: "loc-malkangiri", language: "en",
    education: "CLASS_12", course: "Science", graduationYear: 2025, experience: "FRESHER",
    jobTypes: ["FULL_TIME", "APPRENTICESHIP"], preferredLocationIds: ["loc-malkangiri", "loc-nowrangpur"],
    salaryExpectation: 12000, workModes: ["ONSITE", "FIELD"], industries: ["Healthcare"],
    careerGoal: "Get trained as a community health worker.",
    bio: "Class 12 pass, interested in public health work in my block.",
    skills: [
      { skillId: "sk-communication", proficiency: "INTERMEDIATE", yearsExperience: 2 },
      { skillId: "sk-odiya", proficiency: "ADVANCED", yearsExperience: 10 },
      { skillId: "sk-childcare", proficiency: "BEGINNER", yearsExperience: 1 },
    ],
    onboardingCompleted: true,
  },
  {
    id: "usr-geeta", email: "geeta@gramskill.demo", role: "SEEKER", plainPassword: "demo1234",
    name: "Geeta Padhi", age: 23, locationId: "loc-nowrangpur", language: "hi",
    education: "DIPLOMA", course: "Diploma in Computer Applications", graduationYear: 2023,
    experience: "ZERO_TO_ONE", jobTypes: ["FULL_TIME", "PART_TIME"],
    preferredLocationIds: ["loc-nowrangpur", "loc-koraput"], salaryExpectation: 15000,
    workModes: ["ONSITE", "REMOTE"], industries: ["Government Administration", "Accounting & Finance"],
    careerGoal: "Work as a data entry or accounts assistant in my district.",
    bio: "DCA diploma holder with strong typing speed in Odia and English.",
    skills: [
      { skillId: "sk-data-entry", proficiency: "ADVANCED", yearsExperience: 2 },
      { skillId: "sk-typing", proficiency: "ADVANCED", yearsExperience: 2 },
      { skillId: "sk-excel", proficiency: "INTERMEDIATE", yearsExperience: 2 },
      { skillId: "sk-odiya", proficiency: "ADVANCED", yearsExperience: 8 },
    ],
    onboardingCompleted: true,
  },
];

export function buildProfile(account: DemoAccount): Profile {
  return {
    userId: account.id,
    name: account.name,
    age: account.age,
    phone: null,
    locationId: account.locationId,
    language: account.language,
    education: account.education,
    course: account.course,
    graduationYear: account.graduationYear,
    experience: account.experience,
    jobTypes: account.jobTypes,
    preferredLocationIds: account.preferredLocationIds,
    salaryExpectation: account.salaryExpectation,
    workModes: account.workModes,
    industries: account.industries,
    careerGoal: account.careerGoal,
    bio: account.bio,
    resumeText: "",
    skills: account.skills,
    onboardingCompleted: account.onboardingCompleted,
    updatedAt: new Date().toISOString(),
  };
}

export function buildUser(account: DemoAccount): User {
  return {
    id: account.id,
    email: account.email,
    passwordHash: DEMO_PASSWORD_HASH,
    role: account.role,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    profile: buildProfile(account),
  };
}

/* --------------------------- Demo applications ---------------------------- */

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function daysAheadIso(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

interface AppSeed {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedDaysAgo: number;
  interviewInDays?: number;
  nextAction: string;
  nextActionInDays?: number;
  coverNote: string;
}

const APP_SEEDS: AppSeed[] = [
  {
    id: "app-ravi-1", userId: "usr-ravi", jobId: "job-accounts-assistant-koraput", status: "INTERVIEW",
    appliedDaysAgo: 9, interviewInDays: 3,
    nextAction: "Attend interview at Koraput office — carry marksheet and ID",
    nextActionInDays: 3,
    coverNote: "I have completed a Diploma in Commerce and manage Excel-based bookkeeping already.",
  },
  {
    id: "app-ravi-2", userId: "usr-ravi", jobId: "job-junior-accountant-bolangir", status: "UNDER_REVIEW",
    appliedDaysAgo: 6, nextAction: "Follow up with HR if no response by Friday", nextActionInDays: 4,
    coverNote: "Keen to start as a junior accountant and learn Tally on the job.",
  },
  {
    id: "app-ravi-3", userId: "usr-ravi", jobId: "job-accounts-intern-bhubaneswar", status: "APPLIED",
    appliedDaysAgo: 3, nextAction: "Wait for screening result", nextActionInDays: 7,
    coverNote: "Remote internship fits my village location perfectly.",
  },
  {
    id: "app-ravi-4", userId: "usr-ravi", jobId: "job-gst-return-filer-remote", status: "SAVED",
    appliedDaysAgo: 1, nextAction: "Complete GST Basics training then apply", nextActionInDays: 14,
    coverNote: "",
  },
  {
    id: "app-ravi-5", userId: "usr-ravi", jobId: "job-data-entry-koraput", status: "REJECTED",
    appliedDaysAgo: 21, nextAction: "Improve Odia typing speed and reapply next cycle",
    coverNote: "Applied by mistake without the typing certificate.",
  },
  {
    id: "app-ravi-6", userId: "usr-ravi", jobId: "job-mis-assistant-bhubaneswar", status: "SAVED",
    appliedDaysAgo: 2, nextAction: "Update profile with SQL basics training", nextActionInDays: 20,
    coverNote: "",
  },
  // other users
  { id: "app-sita-1", userId: "usr-sita", jobId: "job-accounts-executive-sambalpur", status: "INTERVIEW", appliedDaysAgo: 12, interviewInDays: 2, nextAction: "Interview round 2", coverNote: "B.Com with GST exposure." },
  { id: "app-sita-2", userId: "usr-sita", jobId: "job-payroll-assistant-sambalpur", status: "SELECTED", appliedDaysAgo: 30, nextAction: "Join on the 1st", coverNote: "Ready to join immediately." },
  { id: "app-sita-3", userId: "usr-sita", jobId: "job-accounts-assistant-koraput", status: "APPLIED", appliedDaysAgo: 4, nextAction: "Awaiting screening", coverNote: "" },
  { id: "app-bikash-1", userId: "usr-bikash", jobId: "job-solar-technician-koraput", status: "UNDER_REVIEW", appliedDaysAgo: 5, nextAction: "Document verification", coverNote: "ITI electrician, ready to travel." },
  { id: "app-bikash-2", userId: "usr-bikash", jobId: "job-electrician-rayagada", status: "APPLIED", appliedDaysAgo: 7, nextAction: "Awaiting call", coverNote: "" },
  { id: "app-bikash-3", userId: "usr-bikash", jobId: "job-ac-technician-bhubaneswar", status: "SAVED", appliedDaysAgo: 2, nextAction: "Prepare tool kit photo", coverNote: "" },
  { id: "app-laxmi-1", userId: "usr-laxmi", jobId: "job-tailor-sambalpur", status: "SELECTED", appliedDaysAgo: 18, nextAction: "Report to the unit", coverNote: "Four years of machine stitching." },
  { id: "app-laxmi-2", userId: "usr-laxmi", jobId: "job-handloom-designer-kandhamal", status: "APPLIED", appliedDaysAgo: 6, nextAction: "Awaiting response", coverNote: "" },
  { id: "app-anil-1", userId: "usr-anil", jobId: "job-web-developer-remote", status: "UNDER_REVIEW", appliedDaysAgo: 3, nextAction: "Complete take-home task", nextActionInDays: 5, coverNote: "Portfolio attached." },
  { id: "app-anil-2", userId: "usr-anil", jobId: "job-mis-executive-sql-bhubaneswar", status: "INTERVIEW", appliedDaysAgo: 8, interviewInDays: 5, nextAction: "Prepare SQL joins", coverNote: "Interested in analytics." },
  { id: "app-mamata-1", userId: "usr-mamata", jobId: "job-dairy-extension-officer-kalahandi", status: "APPLIED", appliedDaysAgo: 4, nextAction: "Awaiting shortlist", coverNote: "Dairy farming family background." },
  { id: "app-deepak-1", userId: "usr-deepak", jobId: "job-mason-supervisor-kalahandi", status: "INTERVIEW", appliedDaysAgo: 15, interviewInDays: 6, nextAction: "Site visit interview", coverNote: "Ten years of masonry work." },
  { id: "app-deepak-2", userId: "usr-deepak", jobId: "job-plumber-bhubaneswar", status: "SAVED", appliedDaysAgo: 1, nextAction: "Confirm tool availability", coverNote: "" },
  { id: "app-priya-1", userId: "usr-priya", jobId: "job-customer-support-remote", status: "UNDER_REVIEW", appliedDaysAgo: 2, nextAction: "Voice test round", nextActionInDays: 3, coverNote: "Fluent Hindi and English." },
  { id: "app-suresh-1", userId: "usr-suresh", jobId: "job-cyber-security-trainee-ranchi", status: "APPLIED", appliedDaysAgo: 5, nextAction: "Awaiting screening", coverNote: "BCA graduate." },
  { id: "app-suresh-2", userId: "usr-suresh", jobId: "job-post-office-assistant-kalahandi", status: "REJECTED", appliedDaysAgo: 25, nextAction: "Look for roles closer to Ranchi", coverNote: "" },
  { id: "app-kabita-1", userId: "usr-kabita", jobId: "job-handloom-designer-kandhamal", status: "SELECTED", appliedDaysAgo: 20, nextAction: "First craft batch assigned", coverNote: "Twelve years of weaving." },
  { id: "app-rahul-1", userId: "usr-rahul", jobId: "job-asha-health-worker-malkangiri", status: "UNDER_REVIEW", appliedDaysAgo: 6, nextAction: "Health certificate submission", nextActionInDays: 8, coverNote: "Local resident of the block." },
  { id: "app-geeta-1", userId: "usr-geeta", jobId: "job-data-entry-koraput", status: "INTERVIEW", appliedDaysAgo: 7, interviewInDays: 4, nextAction: "Typing test at the centre", coverNote: "Odia typing certified." },
  { id: "app-geeta-2", userId: "usr-geeta", jobId: "job-billing-clerk-gajapati", status: "APPLIED", appliedDaysAgo: 3, nextAction: "Awaiting response", coverNote: "" },
];

const STATUS_ORDER: ApplicationStatus[] = ["SAVED", "APPLIED", "UNDER_REVIEW", "INTERVIEW", "SELECTED"];

function buildTimeline(seed: AppSeed): Application["timeline"] {
  const stop = STATUS_ORDER.indexOf(seed.status);
  const timeline: Application["timeline"] = [];
  const path = seed.status === "REJECTED" ? (["SAVED", "APPLIED", "UNDER_REVIEW", "REJECTED"] as ApplicationStatus[]) : STATUS_ORDER.slice(0, stop + 1);
  const totalDays = seed.appliedDaysAgo;
  path.forEach((status, i) => {
    const offset = Math.round((totalDays / Math.max(path.length - 1, 1)) * (path.length - 1 - i));
    timeline.push({
      status,
      at: daysAgoIso(offset),
      note:
        status === "SAVED"
          ? "Added to saved jobs"
          : status === "APPLIED"
            ? "Application submitted"
            : status === "UNDER_REVIEW"
              ? "Recruiter is reviewing the profile"
              : status === "INTERVIEW"
                ? "Interview scheduled"
                : status === "SELECTED"
                  ? "Offer received"
                  : "Not shortlisted for this role",
    });
  });
  return timeline;
}

export const DEMO_APPLICATIONS: Application[] = APP_SEEDS.map((seed) => ({
  id: seed.id,
  userId: seed.userId,
  jobId: seed.jobId,
  status: seed.status,
  appliedAt: daysAgoIso(seed.appliedDaysAgo),
  interviewAt: seed.interviewInDays != null ? daysAheadIso(seed.interviewInDays) : null,
  nextAction: seed.nextAction,
  nextActionAt: seed.nextActionInDays != null ? daysAheadIso(seed.nextActionInDays) : null,
  coverNote: seed.coverNote,
  isDemo: true,
  timeline: buildTimeline(seed),
}));

/* --------------------------- Demo training records ------------------------ */

const TRAINING_SEEDS: [string, string, UserTraining["status"], number][] = [
  ["usr-ravi", "trn-advanced-excel", "IN_PROGRESS", 62],
  ["usr-ravi", "trn-tally-prime", "RECOMMENDED", 0],
  ["usr-ravi", "trn-gst-basics", "RECOMMENDED", 0],
  ["usr-ravi", "trn-digital-payments", "COMPLETED", 100],
  ["usr-sita", "trn-gst-basics", "IN_PROGRESS", 40],
  ["usr-sita", "trn-payroll", "ENROLLED", 0],
  ["usr-bikash", "trn-solar-suryamitra", "IN_PROGRESS", 25],
  ["usr-laxmi", "trn-tailoring", "COMPLETED", 100],
  ["usr-anil", "trn-web-development", "IN_PROGRESS", 55],
  ["usr-priya", "trn-spoken-english", "IN_PROGRESS", 70],
  ["usr-mamata", "trn-dairy", "ENROLLED", 0],
  ["usr-kabita", "trn-entrepreneurship", "RECOMMENDED", 0],
  ["usr-suresh", "trn-cyber-safety", "COMPLETED", 100],
  ["usr-deepak", "trn-electrical", "RECOMMENDED", 0],
];

export const DEMO_USER_TRAINING: UserTraining[] = TRAINING_SEEDS.map(([userId, trainingId, status, progress], i) => ({
  id: `ut-${i + 1}`,
  userId,
  trainingId,
  status,
  progress,
  enrolledAt: daysAgoIso(10 + i * 3),
}));

/* ------------------------------- Notifications ---------------------------- */

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "ntf-1", userId: "usr-ravi", kind: "APPLICATION",
    title: "Interview scheduled",
    body: "Utkal Agro Traders (Demo) invited you for an interview. Carry your marksheet and ID.",
    href: "/applications", read: false, createdAt: daysAgoIso(1),
  },
  {
    id: "ntf-2", userId: "usr-ravi", kind: "TRAINING",
    title: "New training recommended",
    body: "GST Filing Basics was added to your learning path for Accounts Assistant.",
    href: "/training", read: false, createdAt: daysAgoIso(2),
  },
  {
    id: "ntf-3", userId: "usr-ravi", kind: "DEADLINE",
    title: "Application deadline approaching",
    body: "Data Entry Operator at Koraput District Services Centre (Demo) closes in 10 days.",
    href: "/jobs", read: true, createdAt: daysAgoIso(3),
  },
  {
    id: "ntf-4", userId: "usr-ravi", kind: "JOB",
    title: "5 new jobs match your profile",
    body: "Fresh matches for Accounts Assistant were found near Koraput (Demo).",
    href: "/jobs", read: true, createdAt: daysAgoIso(4),
  },
  {
    id: "ntf-5", userId: "usr-sita", kind: "APPLICATION",
    title: "You have been selected",
    body: "Hirakud Industrial Works (Demo) selected you for Payroll Assistant.",
    href: "/applications", read: false, createdAt: daysAgoIso(2),
  },
];

/**
 * Database seed.
 *
 * Loads the same fictional demo dataset the in-memory repository uses, so
 * switching `DATA_SOURCE=demo → postgres` changes nothing about what the UI
 * shows. Run with `npm run db:seed` after `npm run db:push`.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_JOBS } from "../src/lib/data/jobs";
import { DEMO_TRAINING } from "../src/lib/data/training";
import {
  DEMO_APPLICATIONS,
  DEMO_ACCOUNTS,
  DEMO_NOTIFICATIONS,
  DEMO_USER_TRAINING,
  buildProfile,
} from "../src/lib/data/users";
import { DEMO_LOCATIONS, SKILL_CATALOGUE } from "../src/lib/data/catalogue";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding GramSkill AI demo dataset…");

  // ------------------------------------------------------------- reference --
  for (const location of DEMO_LOCATIONS) {
    await prisma.location.upsert({
      where: { id: location.id },
      create: location,
      update: location,
    });
  }
  console.log(`   ✓ ${DEMO_LOCATIONS.length} locations`);

  for (const skill of SKILL_CATALOGUE) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      create: {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        learningWeeks: skill.learningWeeks,
        aliases: skill.aliases,
      },
      update: {
        name: skill.name,
        category: skill.category,
        learningWeeks: skill.learningWeeks,
        aliases: skill.aliases,
      },
    });
  }
  console.log(`   ✓ ${SKILL_CATALOGUE.length} skills`);

  // ------------------------------------------------------------------ users --
  const passwordHash = await bcrypt.hash("demo1234", 10);

  for (const account of DEMO_ACCOUNTS) {
    const profile = buildProfile(account);
    await prisma.user.upsert({
      where: { id: account.id },
      create: { id: account.id, email: account.email, passwordHash, role: account.role },
      update: { email: account.email, passwordHash, role: account.role },
    });

    await prisma.profile.upsert({
      where: { userId: account.id },
      create: {
        userId: account.id,
        name: profile.name,
        age: profile.age,
        phone: profile.phone,
        language: profile.language,
        locationId: profile.locationId,
        education: profile.education,
        course: profile.course,
        graduationYear: profile.graduationYear,
        experience: profile.experience,
        jobTypes: profile.jobTypes,
        workModes: profile.workModes,
        industries: profile.industries,
        salaryExpectation: profile.salaryExpectation,
        careerGoal: profile.careerGoal,
        bio: profile.bio,
        onboardingCompleted: profile.onboardingCompleted,
      },
      update: {
        name: profile.name,
        age: profile.age,
        locationId: profile.locationId,
        education: profile.education,
        course: profile.course,
        graduationYear: profile.graduationYear,
        experience: profile.experience,
        jobTypes: profile.jobTypes,
        workModes: profile.workModes,
        industries: profile.industries,
        salaryExpectation: profile.salaryExpectation,
        careerGoal: profile.careerGoal,
        bio: profile.bio,
        onboardingCompleted: profile.onboardingCompleted,
      },
    });

    await prisma.userSkill.deleteMany({ where: { userId: account.id } });
    if (account.skills.length) {
      await prisma.userSkill.createMany({
        data: account.skills.map((skill) => ({
          userId: account.id,
          skillId: skill.skillId,
          proficiency: skill.proficiency,
          yearsExperience: skill.yearsExperience,
        })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`   ✓ ${DEMO_ACCOUNTS.length} users (password: demo1234)`);

  const profileRows = await prisma.profile.findMany();
  const profileByUserId = new Map(profileRows.map((profile) => [profile.userId, profile.id]));

  for (const account of DEMO_ACCOUNTS) {
    const profileId = profileByUserId.get(account.id);
    if (!profileId) continue;
    await prisma.profilePreferredLocation.deleteMany({ where: { profileId } });
    const preferred = buildProfile(account).preferredLocationIds;
    if (preferred.length) {
      await prisma.profilePreferredLocation.createMany({
        data: preferred.map((locationId) => ({ profileId, locationId })),
        skipDuplicates: true,
      });
    }
  }

  // ------------------------------------------------------------------- jobs --
  for (const job of DEMO_JOBS) {
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
    await prisma.job.upsert({ where: { id: job.id }, create: { id: job.id, ...data }, update: data });

    await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });
    await prisma.jobSkill.createMany({
      data: job.skills.map((skill) => ({
        jobId: job.id,
        skillId: skill.skillId,
        importance: skill.importance,
        minProficiency: skill.minProficiency,
      })),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${DEMO_JOBS.length} job postings`);

  // --------------------------------------------------------------- training --
  for (const programme of DEMO_TRAINING) {
    const data = {
      title: programme.title,
      provider: programme.provider,
      description: programme.description,
      durationWeeks: programme.durationWeeks,
      mode: programme.mode,
      language: programme.language,
      cost: programme.cost,
      certification: programme.certification,
      rating: programme.rating,
      enrolments: programme.enrolments,
      careerPath: programme.careerPath,
      locationId: programme.locationId,
    };
    await prisma.training.upsert({
      where: { id: programme.id },
      create: { id: programme.id, ...data },
      update: data,
    });
    await prisma.trainingSkill.deleteMany({ where: { trainingId: programme.id } });
    await prisma.trainingSkill.createMany({
      data: programme.skillIds.map((skillId) => ({ trainingId: programme.id, skillId })),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${DEMO_TRAINING.length} training programmes`);

  // ----------------------------------------------------------- applications --
  for (const application of DEMO_APPLICATIONS) {
    await prisma.application.deleteMany({
      where: { userId: application.userId, jobId: application.jobId },
    });
    await prisma.application.create({
      data: {
        id: application.id,
        userId: application.userId,
        jobId: application.jobId,
        status: application.status,
        appliedAt: new Date(application.appliedAt),
        interviewAt: application.interviewAt ? new Date(application.interviewAt) : null,
        nextAction: application.nextAction,
        nextActionAt: application.nextActionAt ? new Date(application.nextActionAt) : null,
        coverNote: application.coverNote,
        isDemo: true,
        events: {
          create: application.timeline.map((entry) => ({
            status: entry.status,
            note: entry.note,
            at: new Date(entry.at),
          })),
        },
      },
    });
  }
  console.log(`   ✓ ${DEMO_APPLICATIONS.length} applications`);

  // ------------------------------------------------------- training records --
  for (const record of DEMO_USER_TRAINING) {
    await prisma.userTraining.upsert({
      where: { userId_trainingId: { userId: record.userId, trainingId: record.trainingId } },
      create: {
        userId: record.userId,
        trainingId: record.trainingId,
        status: record.status,
        progress: record.progress,
        enrolledAt: new Date(record.enrolledAt),
      },
      update: { status: record.status, progress: record.progress },
    });
  }
  console.log(`   ✓ ${DEMO_USER_TRAINING.length} training enrolments`);

  // ---------------------------------------------------------- notifications --
  for (const notification of DEMO_NOTIFICATIONS) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        kind: notification.kind,
        href: notification.href,
        read: notification.read,
        createdAt: new Date(notification.createdAt),
      },
      update: {
        title: notification.title,
        body: notification.body,
        read: notification.read,
      },
    });
  }
  console.log(`   ✓ ${DEMO_NOTIFICATIONS.length} notifications`);

  console.log("\n✅ Seed complete. Sign in with ravi@gramskill.demo / demo1234");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

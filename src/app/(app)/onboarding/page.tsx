import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireWorkspace } from "@/lib/server/workspace";

export const metadata: Metadata = { title: "Create your career profile" };

export default async function OnboardingPage() {
  const workspace = await requireWorkspace();

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Create your AI Career Profile
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Six short steps. Everything you enter is used only to rank jobs, detect skill gaps and recommend
          training.
        </p>
      </header>

      <OnboardingWizard
        profile={workspace.profile}
        skills={workspace.skills}
        locations={workspace.locations}
      />
    </div>
  );
}

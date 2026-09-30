import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineDemoNote } from "@/components/shared/brand";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    title: "What we store",
    body: "Only what the matching engine needs: your name, age band, location, education, experience, skills, preferences, career goal and the applications you create. Every field is visible and editable from your profile page.",
  },
  {
    title: "What we never do",
    body: "We never submit an application without an explicit confirmation from you, never share your profile with an employer without your action, and never sell or broker personal data.",
  },
  {
    title: "AI decisions are explainable",
    body: "Automated ranking never hides itself. Every match shows the six factors and their contributions, and every skill gap shows the jobs that create it, so you can dispute or correct the inputs.",
  },
  {
    title: "Data minimisation",
    body: "Voice input is processed by the browser's speech service and is never uploaded to our servers. Accessibility preferences (language, simple mode, low-bandwidth) are stored only in your device's local storage.",
  },
  {
    title: "Security",
    body: "Passwords are hashed with bcrypt and never stored in plain text. Sessions use signed, httpOnly, SameSite cookies with a 7-day expiry. Authentication and agent endpoints are rate limited, and every API input is validated with a schema before use.",
  },
  {
    title: "This demo build",
    body: "This deployment runs on a fictional dataset. Do not enter real personal information, government identifiers or resumes when exploring the demo.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-page py-14">
      <Badge variant="muted" className="mb-4">
        Privacy &amp; consent
      </Badge>
      <h1 className="font-display text-3xl font-bold tracking-tight">How your data is handled</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Employment platforms hold sensitive information about people in vulnerable situations. These are the
        rules this build follows.
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">{section.body}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <InlineDemoNote>
          This page describes the behaviour of the academic prototype. A production deployment would also
          require a published retention policy, a grievance officer and compliance with applicable Indian data
          protection law.
        </InlineDemoNote>
      </div>
    </div>
  );
}

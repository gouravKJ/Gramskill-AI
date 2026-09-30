import type { Metadata } from "next";
import { Mail, ShieldCheck, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { DemoBadge } from "@/components/shared/brand";
import { requireWorkspace } from "@/lib/server/workspace";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const workspace = await requireWorkspace();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <UserCog className="size-5 text-primary" />
            My Career Profile
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Everything the matching engine, the skill-gap analyser and the AI assistant use to help you.
          </p>
        </div>
        <DemoBadge />
      </header>

      <ProfileEditor
        profile={workspace.profile}
        skills={workspace.skills}
        locations={workspace.locations}
        completion={workspace.profileCompletion}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-secondary" />
            Account
          </CardTitle>
          <CardDescription>Session and data-handling details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
              <Mail className="size-3.5 text-muted-foreground" />
              {workspace.session.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <Badge variant={workspace.session.role === "ADMIN" ? "secondary" : "muted"} className="mt-0.5">
              {workspace.session.role === "ADMIN" ? "Administrator" : "Job seeker"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account created</p>
            <p className="mt-0.5 text-sm font-medium">{formatDate(workspace.user.createdAt)}</p>
          </div>
          <div className="sm:col-span-3">
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              Your password is hashed with bcrypt and never stored in plain text. Sessions use signed,
              httpOnly cookies that expire after 7 days. Data source:{" "}
              <strong className="text-foreground">{workspace.repo.source}</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

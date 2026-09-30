"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BottomNav, MobileNavSheet, SidebarNav } from "@/components/layout/app-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { AccessibilityMenu } from "@/components/shared/accessibility-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoBadge, Logo } from "@/components/shared/brand";
import { usePreferences } from "@/components/providers/app-providers";
import type { Notification, SessionUser } from "@/types";

/**
 * Shell for every authenticated page: persistent sidebar (desktop), bottom tab
 * bar (mobile), sticky top bar with notifications, accessibility and account.
 */
export function AppShell({
  session,
  notifications,
  applicationCount,
  dataSource,
  children,
}: {
  session: SessionUser;
  notifications: Notification[];
  applicationCount: number;
  dataSource: "demo" | "postgres";
  children: React.ReactNode;
}) {
  const { t } = usePreferences();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border glass-panel">
        <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
          <div className="lg:hidden">
            <MobileNavSheet role={session.role}>
              <span className="sr-only">Menu</span>
            </MobileNavSheet>
          </div>
          <div className="hidden lg:block">
            <Logo />
          </div>
          <div className="lg:hidden">
            <Logo compact />
          </div>

          <Badge variant="demo" className="hidden md:inline-flex">
            {dataSource === "demo" ? "Demo dataset" : "PostgreSQL"}
          </Badge>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link href="/agent">
                <Sparkles className="size-4" />
                {t("nav.agent")}
              </Link>
            </Button>
            <AccessibilityMenu className="hidden sm:inline-flex" />
            <NotificationBell notifications={notifications} />
            <UserMenu session={session} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border bg-card/40 px-3 py-5 lg:block">
          <SidebarNav counts={{ applications: applicationCount }} role={session.role} />
          <div className="mt-6 rounded-xl border border-dashed border-secondary/40 bg-secondary/5 p-3">
            <DemoBadge />
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              All employers, salaries and locations in this build are fictional demo records created
              for evaluation.
            </p>
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-3 pb-24 pt-5 sm:px-5 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

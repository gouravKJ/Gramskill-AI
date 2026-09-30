"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  FileText,
  LayoutDashboard,
  Map,
  Menu,
  Settings,
  Sparkles,
  Target,
  User,
  Briefcase,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/brand";
import { AccessibilityMenu } from "@/components/shared/accessibility-menu";

/**
 * Two navigation surfaces, one source of truth:
 *  - ≥lg screens get a persistent sidebar
 *  - <lg screens get a bottom tab bar (thumb-reachable, the dominant pattern
 *    for first-time rural smartphone users)
 */

export interface NavItem {
  href: string;
  labelKey: Parameters<ReturnType<typeof usePreferences>["t"]>[0] | null;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOnly?: boolean;
}

export function useNavItems(counts: { applications?: number } = {}, role?: "SEEKER" | "ADMIN"): NavItem[] {
  const all: NavItem[] = [
    { href: "/dashboard", labelKey: "nav.dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", labelKey: "nav.jobs", label: "Jobs", icon: Briefcase },
    { href: "/agent", labelKey: "nav.agent", label: "AI Agent", icon: Bot },
    {
      href: "/applications",
      labelKey: "nav.applications",
      label: "Applications",
      icon: FileText,
      badge: counts.applications,
    },
    { href: "/skill-gaps", labelKey: "nav.skillGaps", label: "Skill Gaps", icon: Target },
    { href: "/training", labelKey: "nav.training", label: "Training", icon: Sparkles },
    { href: "/map", labelKey: "nav.map", label: "Local Map", icon: Map },
    { href: "/opportunities", labelKey: "nav.opportunities", label: "Opportunities", icon: BarChart3 },
    { href: "/insights", labelKey: "nav.insights", label: "AI Insights", icon: BarChart3 },
    { href: "/profile", labelKey: "nav.profile", label: "Profile", icon: User },
    { href: "/admin", labelKey: "nav.admin", label: "Admin", icon: Settings, adminOnly: true },
  ];
  // Admin-only entries are hidden entirely rather than shown-then-denied.
  return all.filter((item) => !item.adminOnly || role === "ADMIN");
}

export function SidebarNav({
  counts = {},
  role = "SEEKER",
}: {
  counts?: { applications?: number };
  role?: "SEEKER" | "ADMIN";
}) {
  const pathname = usePathname();
  const { t } = usePreferences();
  const items = useNavItems(counts, role);

  return (
    <nav aria-label="Application" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const label = item.labelKey ? t(item.labelKey) : item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
            {item.badge ? (
              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                {item.badge}
              </Badge>
            ) : null}
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

const BOTTOM_ITEMS: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/agent", label: "AI Agent", icon: Bot },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
];

/** Thumb-reachable bottom navigation for phones. */
export function BottomNav() {
  const pathname = usePathname();
  const { t } = usePreferences();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-active"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                  />
                )}
                <item.icon className="size-5" />
                <span className="truncate">
                  {item.href === "/dashboard" ? t("nav.home") : item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile drawer that exposes the full navigation list. */
export function MobileNavSheet({
  children,
  counts = {},
  role = "SEEKER",
}: {
  children?: React.ReactNode;
  counts?: { applications?: number };
  role?: "SEEKER" | "ADMIN";
}) {
  const [open, setOpen] = React.useState(false);
  const items = useNavItems(counts, role);
  const { t } = usePreferences();
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="size-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="relative h-full w-4/5 max-w-xs overflow-y-auto border-r border-border bg-card p-4"
          >
            <Logo className="mb-5" />
            <nav aria-label="All sections" className="flex flex-col gap-1">
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.labelKey ? t(item.labelKey) : item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-5">
              <AccessibilityMenu className="w-full" />
            </div>
          </motion.div>
        </div>
      )}
      {children}
    </>
  );
}

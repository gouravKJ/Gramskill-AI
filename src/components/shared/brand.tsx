"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/app-providers";

export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: string | null;
  compact?: boolean;
}) {
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Sprout className="size-5" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-secondary ring-2 ring-background" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight">GramSkill AI</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Skills → Opportunities
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="rounded-lg" aria-label="GramSkill AI home">
      {content}
    </Link>
  );
}

/** Marks content as fictional demo data. Used next to every demo dataset. */
export function DemoBadge({
  className,
  long = false,
}: {
  className?: string;
  long?: boolean;
}) {
  const t = useT();
  return (
    <span
      title={t("label.demoDataLong")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed border-secondary/50 bg-secondary/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-secondary" aria-hidden />
      {long ? t("label.demoDataLong") : t("label.demoData")}
    </span>
  );
}

export function InlineDemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-secondary/40 bg-secondary/5 px-3 py-2 text-[11px] leading-relaxed text-secondary">
      {children}
    </p>
  );
}

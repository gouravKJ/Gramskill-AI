"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/metrics";
import { usePreferences } from "@/components/providers/app-providers";

/** Greeting uses the device clock so "Good morning" is correct for the user. */
export function Greeting({
  name,
  completion,
  isAdmin,
  goal,
}: {
  name: string;
  completion: number;
  isAdmin: boolean;
  goal: string;
}) {
  const { t } = usePreferences();
  const [greeting, setGreeting] = React.useState("Hello");

  React.useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {greeting}, {name.split(" ")[0]} 👋
        </motion.h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {goal || "Add a career goal to your profile so the assistant can personalise its advice."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="size-3" /> Administrator account
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1">
              <Sparkles className="size-3" /> AI matching active
            </Badge>
          )}
          <Badge variant="muted">
            {t("nav.profile")} {completion}% complete
          </Badge>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <ScoreRing score={completion} size={104} strokeWidth={9} label="Profile" />
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ShieldCheck, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import type { SessionUser } from "@/types";

export function UserMenu({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function signOut() {
    setPending(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed");
      toast.success("Signed out", { description: "See you soon." });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out", { description: "Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 text-left transition-colors hover:bg-muted"
          aria-label="Account menu"
        >
          <Avatar className="size-8">
            <AvatarFallback>{initials(session.name || session.email)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
            {session.name.split(" ")[0] || "Account"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-foreground">{session.name}</span>
          <span className="truncate text-xs font-normal">{session.email}</span>
        </DropdownMenuLabel>
        <div className="px-2.5 pb-1">
          <Badge variant={session.role === "ADMIN" ? "secondary" : "muted"} className="text-[10px]">
            {session.role === "ADMIN" ? (
              <>
                <ShieldCheck className="size-3" /> Administrator
              </>
            ) : (
              "Job seeker"
            )}
          </Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User /> My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/insights">
            <Sparkles /> AI insights
          </Link>
        </DropdownMenuItem>
        {session.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Settings /> Admin dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} disabled={pending} className="text-destructive">
          <LogOut /> {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

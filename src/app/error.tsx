"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/brand";

/** Global error boundary. Shows a recoverable screen instead of a blank page. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[gramskill] unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The page hit an unexpected error. This is usually temporary — try again, or go back to your
          dashboard.
        </p>
        {error.digest && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

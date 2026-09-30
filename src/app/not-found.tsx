import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="size-6" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          That page does not exist. If you followed a job link, the posting may not be part of the current demo
          dataset.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}

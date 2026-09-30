import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/skeleton";

/** Route-level loading skeleton so navigation never shows a blank screen. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-4 w-32" />
          <SkeletonText lines={5} className="mt-4" />
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/auth-form";
import { SkeletonCard } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; demo?: string }>;
}) {
  await searchParams;

  return (
    <Suspense fallback={<SkeletonCard className="h-96" />}>
      <LoginForm />
    </Suspense>
  );
}

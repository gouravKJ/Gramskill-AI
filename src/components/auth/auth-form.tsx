"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/shared/brand";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validators";
import type { ApiResult } from "@/lib/api/http";

export const DEMO_CREDENTIALS = { email: "ravi@gramskill.demo", password: "demo1234" };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiResult<{ needsOnboarding: boolean }>;

    if (!payload.ok) {
      form.setError("password", { message: payload.error });
      toast.error("Sign in failed", { description: payload.error });
      return;
    }

    toast.success("Welcome back", { description: "Loading your dashboard…" });
    router.push(payload.data.needsOnboarding ? "/onboarding" : next);
    router.refresh();
  });

  return (
    <Card className="w-full shadow-[var(--shadow-lift)]">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Continue to your skill profile and job matches.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                className="pr-10"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-dashed border-secondary/40 bg-secondary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Explore Demo</span>
            <DemoBadge />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Signs you in as <strong className="text-foreground">Ravi Kumar</strong>, a diploma holder from
            rural Odisha with skills, applications and training progress already set up.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => {
              form.setValue("email", DEMO_CREDENTIALS.email);
              form.setValue("password", DEMO_CREDENTIALS.password);
              void submit();
            }}
          >
            <Sparkles className="size-4" />
            Continue as demo user
          </Button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Credentials: <code className="rounded bg-card px-1.5 py-0.5">{DEMO_CREDENTIALS.email}</code> /{" "}
            <code className="rounded bg-card px-1.5 py-0.5">{DEMO_CREDENTIALS.password}</code>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiResult<{ needsOnboarding: boolean }>;

    if (!payload.ok) {
      form.setError("email", { message: payload.error });
      toast.error("Could not create account", { description: payload.error });
      return;
    }

    toast.success("Account created", { description: "Let's build your career profile." });
    router.push("/onboarding");
    router.refresh();
  });

  return (
    <Card className="w-full shadow-[var(--shadow-lift)]">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>Two minutes to a personalised job match list.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="e.g. Ravi Kumar"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters, with a number"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Passwords are hashed with bcrypt before storage — never saved in plain text.
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Create account and build my profile
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/dialog";
import { Logo } from "@/components/shared/brand";
import { AccessibilityMenu } from "@/components/shared/accessibility-menu";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const NAV_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Jobs", href: "/jobs" },
  { label: "Training", href: "/training" },
  { label: "AI Assistant", href: "/agent" },
  { label: "Insights", href: "/insights" },
];

export function SiteHeader({ session }: { session: SessionUser | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all",
        scrolled ? "glass-panel border-border shadow-sm" : "border-transparent bg-background/80",
      )}
    >
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <AccessibilityMenu className="hidden sm:inline-flex" />

          {session ? (
            <Button asChild size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="hidden">
                <Link href="/register">Get started</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login?demo=1">
                  <Sparkles className="size-4" />
                  Explore Demo
                </Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <Logo href={null} className="mb-4" />
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={session ? "/dashboard" : "/login"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent"
                >
                  {session ? "Dashboard" : "Sign in"}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

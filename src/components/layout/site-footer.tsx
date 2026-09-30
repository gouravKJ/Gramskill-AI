import Link from "next/link";
import { Github, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/brand";
import { DemoBadge } from "@/components/shared/brand";

const LINK_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "About", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Jobs", href: "/jobs" },
      { label: "Training", href: "/training" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { label: "AI Assistant", href: "/agent" },
      { label: "Skill Gap Analysis", href: "/skill-gaps" },
      { label: "AI Insights", href: "/insights" },
      { label: "Local Opportunities", href: "/map" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "Explore Demo", href: "/login?demo=1" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Empowering rural talent through AI. AI-based skill matching and employment support for
            communities that mainstream job portals overlook.
          </p>
          <DemoBadge long />
          <div className="space-y-1.5 pt-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="size-3.5" /> Demonstration project · Odisha, India
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-3.5" /> hello@gramskill.demo
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-3.5" /> 1800-000-000 (demo helpline)
            </p>
          </div>
        </div>

        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="font-display text-sm font-semibold">{group.title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} GramSkill AI · Academic demonstration project.</p>
          <p className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <Github className="size-3.5" /> Open architecture · replaceable AI services
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

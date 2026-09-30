import Link from "next/link";
import { ShieldCheck, Sparkles, Target, WifiOff } from "lucide-react";
import { Logo } from "@/components/shared/brand";

const HIGHLIGHTS = [
  { icon: Target, text: "Skill-gap analysis that tells you exactly what to learn next" },
  { icon: Sparkles, text: "An agentic AI assistant that searches, explains and drafts applications" },
  { icon: WifiOff, text: "Low-bandwidth mode, voice input and Hindi support built in" },
  { icon: ShieldCheck, text: "Nothing is ever submitted without your explicit confirmation" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="decorative-gradient relative hidden flex-col justify-between border-r border-border p-10 lg:flex">
        <Logo />

        <div>
          <h1 className="text-balance max-w-md font-display text-3xl font-bold leading-tight tracking-tight">
            From skills to opportunities — with AI that explains itself.
          </h1>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm">
                  <item.icon className="size-4" />
                </span>
                <span className="max-w-sm text-sm text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Academic demonstration build · all employers, jobs and statistics are fictional demo data.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 px-4 py-10 sm:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="w-full max-w-md">{children}</div>
        <Link href="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

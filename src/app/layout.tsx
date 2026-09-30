import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GramSkill AI — From Skills to Opportunities",
    template: "%s · GramSkill AI",
  },
  description:
    "AI-based rural skill matching and employment system: skill-gap analysis, explainable job matching, personalised training and an agentic AI job assistant.",
  applicationName: "GramSkill AI",
  keywords: [
    "rural employment",
    "skill matching",
    "AI job matching",
    "skill gap analysis",
    "rural skills India",
    "agentic AI assistant",
  ],
  authors: [{ name: "GramSkill AI" }],
  openGraph: {
    title: "GramSkill AI — From Skills to Opportunities",
    description:
      "AI-powered job matching, skill-gap analysis and intelligent career assistance designed for rural communities.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1720" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

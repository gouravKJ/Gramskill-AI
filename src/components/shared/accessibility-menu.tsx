"use client";

import { Accessibility, Languages, Moon, Sun, Volume2, WifiOff, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/dialog";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet-parts";
import { Label } from "@/components/ui/label";
import { Separator, Switch } from "@/components/ui/misc";
import { usePreferences } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

/**
 * The rural-first accessibility panel: language, simple language, low-bandwidth
 * mode, animation reduction and larger text. Deliberately prominent in the
 * header because a first-time user with low digital literacy may need it before
 * they can use anything else.
 */
export function AccessibilityMenu({ className }: { className?: string }) {
  const { prefs, setPref, toggle, t } = usePreferences();

  const rows: {
    key: "simpleLanguage" | "lowBandwidth" | "reduceMotion" | "largeText";
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
  }[] = [
    {
      key: "simpleLanguage",
      icon: Volume2,
      label: t("a11y.simpleLanguage"),
      description: "Short, easy words in the AI assistant and job pages.",
    },
    {
      key: "lowBandwidth",
      icon: WifiOff,
      label: t("a11y.lowBandwidth"),
      description: "Removes heavy effects so pages load on slow connections.",
    },
    {
      key: "reduceMotion",
      icon: Accessibility,
      label: t("a11y.reduceMotion"),
      description: "Turns off page and card animations.",
    },
    {
      key: "largeText",
      icon: ZoomIn,
      label: t("a11y.largeText"),
      description: "Increases the base font size for easier reading.",
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={className}
          aria-label={t("a11y.settings")}
          title={t("a11y.settings")}
        >
          <Accessibility className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Accessibility className="size-4 text-primary" />
            {t("a11y.settings")}
          </SheetTitle>
          <SheetDescription>
            Built for rural users, low-end phones and slow networks. Settings are saved on this device.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Languages className="size-4 text-muted-foreground" />
            {t("a11y.language")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "hi"] as const).map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setPref("language", locale)}
                aria-pressed={prefs.language === locale}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  prefs.language === locale
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {locale === "en" ? "English" : "हिन्दी"}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-start justify-between gap-4 rounded-lg px-1 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <row.icon className="size-4 shrink-0 text-muted-foreground" />
                  {row.label}
                </Label>
                <p className="mt-1 pl-6 text-xs text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                checked={prefs[row.key]}
                onCheckedChange={() => toggle(row.key)}
                aria-label={row.label}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <Label className="text-sm">{prefs.theme === "dark" ? "Dark theme" : "Light theme"}</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPref("theme", prefs.theme === "dark" ? "light" : "dark")}
          >
            {prefs.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Switch
          </Button>
        </div>

        <p className="mt-auto rounded-lg bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          Tip: on a shared phone, use <strong>Simple language</strong> and <strong>Larger text</strong> so
          family members of any age can read the screen.
        </p>
      </SheetContent>
    </Sheet>
  );
}

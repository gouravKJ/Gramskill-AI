"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/misc";
import { translate, type Locale, type TranslationKey } from "@/lib/i18n";

/**
 * Global preference providers.
 *
 * Rural-first accessibility is a product requirement, not a nice-to-have, so
 * these settings live in one context and are applied to <html> as classes:
 *   - `a11y-large-text`  → bigger base font for low-vision / low-literacy users
 *   - `low-bandwidth`    → kills decorative gradients, blur and heavy shadows
 *   - `reduce-motion`    → disables transitions (also honoured for everyone via
 *                          the prefers-reduced-motion media query)
 */

export interface Preferences {
  theme: "light" | "dark";
  language: Locale;
  simpleLanguage: boolean;
  lowBandwidth: boolean;
  reduceMotion: boolean;
  largeText: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "light",
  language: "en",
  simpleLanguage: false,
  lowBandwidth: false,
  reduceMotion: false,
  largeText: false,
};

const STORAGE_KEY = "gramskill.preferences.v1";

interface PreferencesContextValue {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  toggle: (key: "simpleLanguage" | "lowBandwidth" | "reduceMotion" | "largeText") => void;
  t: (key: TranslationKey) => string;
  ready: boolean;
}

const PreferencesContext = React.createContext<PreferencesContextValue | null>(null);

export function usePreferences() {
  const context = React.useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used inside <AppProviders>");
  return context;
}

/** Convenience hook for translated strings. */
export function useT() {
  return usePreferences().t;
}

function applyToDocument(prefs: Preferences) {
  const root = document.documentElement;
  root.classList.toggle("dark", prefs.theme === "dark");
  root.classList.toggle("a11y-large-text", prefs.largeText);
  root.classList.toggle("low-bandwidth", prefs.lowBandwidth);
  root.classList.toggle("reduce-motion", prefs.reduceMotion);
  root.style.colorScheme = prefs.theme;
  root.lang = prefs.language;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = React.useState<Preferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const systemDark =
        window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
      const systemReduced =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      const next: Preferences = stored
        ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(stored) as Partial<Preferences>) }
        : { ...DEFAULT_PREFERENCES, theme: systemDark ? "dark" : "light", reduceMotion: systemReduced };

      setPrefs(next);
      applyToDocument(next);
    } catch {
      applyToDocument(DEFAULT_PREFERENCES);
    } finally {
      setReady(true);
    }
  }, []);

  const setPref = React.useCallback<PreferencesContextValue["setPref"]>((key, value) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      applyToDocument(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage might be blocked — preferences still apply for this session */
      }
      return next;
    });
  }, []);

  const toggle = React.useCallback<PreferencesContextValue["toggle"]>(
    (key) => {
      setPrefs((current) => {
        const next = { ...current, [key]: !current[key] };
        applyToDocument(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const t = React.useCallback(
    (key: TranslationKey) => translate(prefs.language, key),
    [prefs.language],
  );

  const value = React.useMemo<PreferencesContextValue>(
    () => ({ prefs, setPref, toggle, t, ready }),
    [prefs, setPref, toggle, t, ready],
  );

  return (
    <PreferencesContext.Provider value={value}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "rounded-xl border border-border bg-card text-card-foreground shadow-lg",
          },
        }}
      />
    </PreferencesContext.Provider>
  );
}

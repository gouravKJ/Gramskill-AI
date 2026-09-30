/**
 * Bilingual UI strings (English / हिन्दी).
 *
 * Deliberately small and hand-maintained: only navigation, actions and
 * accessibility controls are translated, because those are what a
 * low-literacy user interacts with most. Domain content (job descriptions)
 * stays in the language the employer published it in.
 */

export type Locale = "en" | "hi";

export const DICTIONARY = {
  en: {
    "nav.home": "Home",
    "nav.jobs": "Jobs",
    "nav.agent": "AI Agent",
    "nav.applications": "Applications",
    "nav.profile": "Profile",
    "nav.dashboard": "Dashboard",
    "nav.training": "Training",
    "nav.skillGaps": "Skill Gaps",
    "nav.map": "Local Map",
    "nav.opportunities": "Opportunities",
    "nav.insights": "AI Insights",
    "nav.admin": "Admin",
    "nav.howItWorks": "How It Works",

    "action.findOpportunities": "Find My Opportunities",
    "action.exploreDemo": "Explore Demo",
    "action.howItWorks": "Explore How It Works",
    "action.viewJob": "View Job",
    "action.whyMatch": "Why This Match?",
    "action.applyWithAi": "Apply with AI",
    "action.explainSimple": "Explain in Simple Language",
    "action.startLearning": "Start Learning Path",
    "action.viewTraining": "View Training",
    "action.search": "Search",
    "action.filters": "Filters",
    "action.apply": "Apply",
    "action.save": "Save",
    "action.next": "Next",
    "action.back": "Back",
    "action.finish": "Finish",
    "action.signIn": "Sign in",
    "action.signOut": "Sign out",
    "action.createAccount": "Create account",

    "a11y.language": "Language",
    "a11y.simpleLanguage": "Simple language",
    "a11y.lowBandwidth": "Low-bandwidth mode",
    "a11y.reduceMotion": "Reduce animations",
    "a11y.largeText": "Larger text",
    "a11y.voiceInput": "Speak instead of typing",
    "a11y.settings": "Accessibility settings",

    "label.demoData": "Demo",
    "label.demoDataLong": "Demo data — fictional, for evaluation only",
    "label.match": "Match",
    "label.skillGap": "Skill Gap",
    "label.loading": "Loading",
    "label.aiThinking": "AI is thinking",
  },
  hi: {
    "nav.home": "होम",
    "nav.jobs": "नौकरियाँ",
    "nav.agent": "एआई सहायक",
    "nav.applications": "आवेदन",
    "nav.profile": "प्रोफ़ाइल",
    "nav.dashboard": "डैशबोर्ड",
    "nav.training": "प्रशिक्षण",
    "nav.skillGaps": "कौशल कमी",
    "nav.map": "स्थानीय नक्शा",
    "nav.opportunities": "अवसर",
    "nav.insights": "एआई जानकारी",
    "nav.admin": "प्रशासन",
    "nav.howItWorks": "यह कैसे काम करता है",

    "action.findOpportunities": "मेरे अवसर खोजें",
    "action.exploreDemo": "डेमो देखें",
    "action.howItWorks": "कार्यप्रणाली देखें",
    "action.viewJob": "नौकरी देखें",
    "action.whyMatch": "यह मैच क्यों?",
    "action.applyWithAi": "एआई से आवेदन करें",
    "action.explainSimple": "सरल भाषा में समझाएँ",
    "action.startLearning": "सीखना शुरू करें",
    "action.viewTraining": "प्रशिक्षण देखें",
    "action.search": "खोजें",
    "action.filters": "फ़िल्टर",
    "action.apply": "आवेदन करें",
    "action.save": "सहेजें",
    "action.next": "आगे",
    "action.back": "पीछे",
    "action.finish": "पूरा करें",
    "action.signIn": "साइन इन",
    "action.signOut": "साइन आउट",
    "action.createAccount": "खाता बनाएँ",

    "a11y.language": "भाषा",
    "a11y.simpleLanguage": "सरल भाषा",
    "a11y.lowBandwidth": "कम डेटा मोड",
    "a11y.reduceMotion": "एनिमेशन कम करें",
    "a11y.largeText": "बड़ा अक्षर",
    "a11y.voiceInput": "बोलकर बताएँ",
    "a11y.settings": "सुगम्यता सेटिंग",

    "label.demoData": "डेमो",
    "label.demoDataLong": "डेमो डेटा — केवल प्रदर्शन हेतु काल्पनिक",
    "label.match": "मैच",
    "label.skillGap": "कौशल कमी",
    "label.loading": "लोड हो रहा है",
    "label.aiThinking": "एआई सोच रहा है",
  },
} as const;

export type TranslationKey = keyof (typeof DICTIONARY)["en"];

export function translate(locale: Locale, key: TranslationKey): string {
  return DICTIONARY[locale]?.[key] ?? DICTIONARY.en[key] ?? key;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};

/** Enum label localisation used across job/application cards. */
export function labelEnumValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

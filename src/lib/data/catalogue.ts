import type { Location, Skill, SkillCategory } from "@/types";

/**
 * DEMO locations — synthetic coordinates inside Odisha and neighbouring states.
 * These are narrative placeholders for the academic demo, NOT verified
 * real-world geocodes. Swap `src/lib/data/repository.ts` for the Postgres
 * repository + a real geocoding API to go live.
 */
export const DEMO_LOCATIONS: Location[] = [
  { id: "loc-koraput", name: "Koraput (Demo)", district: "Koraput", state: "Odisha", lat: 18.8128, lng: 82.7105, isRural: true },
  { id: "loc-rayagada", name: "Rayagada (Demo)", district: "Rayagada", state: "Odisha", lat: 19.1711, lng: 83.4163, isRural: true },
  { id: "loc-kalahandi", name: "Bhawanipatna (Demo)", district: "Kalahandi", state: "Odisha", lat: 19.9068, lng: 83.1665, isRural: true },
  { id: "loc-gajapati", name: "Paralakhemundi (Demo)", district: "Gajapati", state: "Odisha", lat: 18.7778, lng: 84.0941, isRural: true },
  { id: "loc-kandhamal", name: "Phulbani (Demo)", district: "Kandhamal", state: "Odisha", lat: 20.4667, lng: 84.2333, isRural: true },
  { id: "loc-bolangir", name: "Bolangir (Demo)", district: "Bolangir", state: "Odisha", lat: 20.7011, lng: 83.4847, isRural: true },
  { id: "loc-malkangiri", name: "Malkangiri (Demo)", district: "Malkangiri", state: "Odisha", lat: 18.35, lng: 81.8833, isRural: true },
  { id: "loc-nowrangpur", name: "Nabarangpur (Demo)", district: "Nabarangpur", state: "Odisha", lat: 19.2333, lng: 82.55, isRural: true },
  { id: "loc-bhubaneswar", name: "Bhubaneswar (Demo)", district: "Khordha", state: "Odisha", lat: 20.2961, lng: 85.8245, isRural: false },
  { id: "loc-sambalpur", name: "Sambalpur (Demo)", district: "Sambalpur", state: "Odisha", lat: 21.4669, lng: 83.9812, isRural: false },
  { id: "loc-ranchi", name: "Ranchi (Demo)", district: "Ranchi", state: "Jharkhand", lat: 23.3441, lng: 85.3096, isRural: false },
  { id: "loc-remote", name: "Work From Home (Demo)", district: "—", state: "India", lat: 20.5937, lng: 78.9629, isRural: false },
];

/** Skill catalogue — the vocabulary used by jobs, training and the matcher. */
export const SKILL_CATALOGUE: Skill[] = [
  // Digital
  { id: "sk-computer-basics", name: "Computer Basics", category: "Digital", learningWeeks: 3, aliases: ["basic computer", "cpu basics", "internet basics"] },
  { id: "sk-ms-office", name: "MS Office", category: "Digital", learningWeeks: 4, aliases: ["microsoft office", "word", "powerpoint"] },
  { id: "sk-excel", name: "Excel", category: "Office & Accounts", learningWeeks: 4, aliases: ["microsoft excel", "spreadsheet", "advanced excel"] },
  { id: "sk-data-entry", name: "Data Entry", category: "Digital", learningWeeks: 3, aliases: ["typing", "data operator", "back office"] },
  { id: "sk-typing", name: "Typing (Hindi/English)", category: "Digital", learningWeeks: 4, aliases: ["hindi typing", "english typing", "stenography"] },
  { id: "sk-tally", name: "Tally Prime", category: "Office & Accounts", learningWeeks: 6, aliases: ["tally", "tally erp", "accounting software"] },
  { id: "sk-gst", name: "GST", category: "Office & Accounts", learningWeeks: 4, aliases: ["gst filing", "taxation", "goods and services tax"] },
  { id: "sk-payroll", name: "Payroll Management", category: "Office & Accounts", learningWeeks: 4, aliases: ["salary processing", "pf esi", "payroll"] },
  { id: "sk-accounting", name: "Accounting", category: "Office & Accounts", learningWeeks: 8, aliases: ["book keeping", "bookkeeping", "accounts"] },
  { id: "sk-financial-literacy", name: "Financial Literacy", category: "Office & Accounts", learningWeeks: 2, aliases: ["banking basics", "passbook", "micro finance"] },
  { id: "sk-digital-payments", name: "Digital Payments (UPI)", category: "Digital", learningWeeks: 2, aliases: ["upi", "bhim", "qr code payments"] },
  { id: "sk-cyber-safety", name: "Cyber Safety", category: "Digital", learningWeeks: 2, aliases: ["online fraud safety", "digital safety"] },
  // Agriculture
  { id: "sk-farming", name: "Farming", category: "Agriculture", learningWeeks: 10, aliases: ["agriculture", "cultivation", "kheti"] },
  { id: "sk-organic-farming", name: "Organic Farming", category: "Agriculture", learningWeeks: 6, aliases: ["natural farming", "jaivik kheti"] },
  { id: "sk-horticulture", name: "Horticulture", category: "Agriculture", learningWeeks: 8, aliases: ["vegetable farming", "nursery management"] },
  { id: "sk-dairy", name: "Dairy & Animal Husbandry", category: "Agriculture", learningWeeks: 8, aliases: ["milk production", "pashupalan", "goat rearing"] },
  { id: "sk-poultry", name: "Poultry Farming", category: "Agriculture", learningWeeks: 5, aliases: ["chicken farming", "poultry"] },
  { id: "sk-fishery", name: "Fishery", category: "Agriculture", learningWeeks: 6, aliases: ["aquaculture", "fish farming"] },
  // Trades
  { id: "sk-electrical", name: "Electrical Work", category: "Trades", learningWeeks: 12, aliases: ["electrician", "wiring", "electric fitter"] },
  { id: "sk-plumbing", name: "Plumbing", category: "Trades", learningWeeks: 10, aliases: ["plumber", "pipe fitting", "sanitary"] },
  { id: "sk-welding", name: "Welding", category: "Trades", learningWeeks: 12, aliases: ["welder", "arc welding", "fabrication"] },
  { id: "sk-carpentry", name: "Carpentry", category: "Trades", learningWeeks: 12, aliases: ["wood work", "furniture making"] },
  { id: "sk-masonry", name: "Masonry", category: "Trades", learningWeeks: 10, aliases: ["construction labour", "raj mistri", "brick work"] },
  { id: "sk-solar-installation", name: "Solar Panel Installation", category: "Trades", learningWeeks: 6, aliases: ["solar technician", "rooftop solar", "suryamitra"] },
  { id: "sk-ac-repair", name: "AC & Refrigeration Repair", category: "Trades", learningWeeks: 8, aliases: ["ac mechanic", "refrigeration", "hvac"] },
  { id: "sk-two-wheeler-repair", name: "Two-Wheeler Repair", category: "Trades", learningWeeks: 8, aliases: ["bike mechanic", "automobile repair"] },
  { id: "sk-driving", name: "Driving (LMV)", category: "Logistics", learningWeeks: 6, aliases: ["driver", "commercial vehicle", "heavy vehicle"] },
  { id: "sk-tailoring", name: "Tailoring", category: "Manufacturing", learningWeeks: 12, aliases: ["sewing", "darzi", "stitching", "garment"] },
  { id: "sk-handicraft", name: "Handicraft & Handloom", category: "Manufacturing", learningWeeks: 10, aliases: ["sambalpuri weaving", "cane work", "craft"] },
  // IT & Software
  { id: "sk-programming", name: "Programming", category: "IT & Software", learningWeeks: 16, aliases: ["coding", "python", "javascript"] },
  { id: "sk-web-development", name: "Web Development", category: "IT & Software", learningWeeks: 20, aliases: ["html css", "website development", "frontend"] },
  { id: "sk-database", name: "Database (SQL)", category: "IT & Software", learningWeeks: 10, aliases: ["mysql", "sql queries", "postgres"] },
  { id: "sk-cyber-security", name: "Cyber Security Basics", category: "IT & Software", learningWeeks: 10, aliases: ["network security", "ethical hacking"] },
  { id: "sk-graphic-design", name: "Graphic Design", category: "IT & Software", learningWeeks: 10, aliases: ["photoshop", "canva", "designing"] },
  { id: "sk-bpo-support", name: "Customer Support / BPO", category: "Retail & Services", learningWeeks: 4, aliases: ["call center", "telecalling", "voice process"] },
  // Retail & Services
  { id: "sk-retail-sales", name: "Retail Sales", category: "Retail & Services", learningWeeks: 4, aliases: ["shop assistant", "vending", "kirana"] },
  { id: "sk-hospitality", name: "Hospitality & Housekeeping", category: "Retail & Services", learningWeeks: 6, aliases: ["hotel services", "house keeping", "front office"] },
  { id: "sk-cooking", name: "Cooking / Food Processing", category: "Retail & Services", learningWeeks: 8, aliases: ["chef", "bakery", "food preservation"] },
  { id: "sk-beauty-wellness", name: "Beauty & Wellness", category: "Retail & Services", learningWeeks: 10, aliases: ["salon", "hair cutting", "beautician"] },
  { id: "sk-security-services", name: "Security Guard Services", category: "Retail & Services", learningWeeks: 3, aliases: ["watchman", "security guard"] },
  // Healthcare
  { id: "sk-health-worker", name: "Community Health Work", category: "Healthcare", learningWeeks: 26, aliases: ["asha worker", "health volunteer", "anm"] },
  { id: "sk-pharmacy-assistant", name: "Pharmacy Assistant", category: "Healthcare", learningWeeks: 12, aliases: ["medical store", "pharmacy"] },
  { id: "sk-childcare", name: "Child Care & Anganwadi", category: "Healthcare", learningWeeks: 10, aliases: ["creche", "anganwadi worker", "pre school"] },
  // Communication
  { id: "sk-communication", name: "Communication", category: "Communication", learningWeeks: 4, aliases: ["spoken english", "interpersonal skills", "bolna"] },
  { id: "sk-hindi", name: "Hindi Language", category: "Communication", learningWeeks: 6, aliases: ["hindi writing", "hindi speaking"] },
  { id: "sk-english", name: "English Language", category: "Communication", learningWeeks: 10, aliases: ["spoken english", "english grammar"] },
  { id: "sk-odiya", name: "Odia Language", category: "Communication", learningWeeks: 6, aliases: ["odia typing", "odia reading"] },
  { id: "sk-leadership", name: "Team Leadership", category: "Communication", learningWeeks: 6, aliases: ["supervisor", "team handling", "management"] },
  { id: "sk-interview-skills", name: "Interview Readiness", category: "Communication", learningWeeks: 2, aliases: ["resume writing", "interview preparation"] },
  { id: "sk-resume-writing", name: "Resume Writing", category: "Communication", learningWeeks: 1, aliases: ["cv", "biodata"] },
  { id: "sk-entrepreneurship", name: "Entrepreneurship", category: "Communication", learningWeeks: 8, aliases: ["business planning", "self employment", "vyapar"] },
  { id: "sk-marketing", name: "Digital Marketing", category: "IT & Software", learningWeeks: 8, aliases: ["social media marketing", "whatsapp business"] },
];

export const SKILL_BY_ID = new Map(SKILL_CATALOGUE.map((s) => [s.id, s]));
export const SKILL_BY_NAME = new Map(SKILL_CATALOGUE.map((s) => [s.name.toLowerCase(), s]));

export function skillName(id: string) {
  return SKILL_BY_ID.get(id)?.name ?? id;
}

export const LOCATION_BY_ID = new Map(DEMO_LOCATIONS.map((l) => [l.id, l]));

export function locationById(id: string) {
  return LOCATION_BY_ID.get(id) ?? DEMO_LOCATIONS[0];
}

export const SKILL_CATEGORIES: SkillCategory[] = Array.from(
  new Set(SKILL_CATALOGUE.map((s) => s.category)),
).sort() as SkillCategory[];

export const EDUCATION_ORDER: Record<string, number> = {
  BELOW_10: 0,
  CLASS_10: 1,
  CLASS_12: 2,
  ITI: 3,
  DIPLOMA: 4,
  GRADUATE: 5,
  POST_GRADUATE: 6,
};

export const EXPERIENCE_ORDER: Record<string, number> = {
  FRESHER: 0,
  ZERO_TO_ONE: 1,
  ONE_TO_THREE: 2,
  THREE_PLUS: 3,
};

export const PROFICIENCY_ORDER: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

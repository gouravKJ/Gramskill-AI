"""Skill catalogue mirroring `SKILL_CATALOGUE` in `src/lib/data/catalogue.ts`.

The proxy route sends `skillId` values (not display names), because ids are the
stable key across the TypeScript and Python sides. We keep a local id → name map
so that:

1. the semantic document includes the *readable* skill wording, which makes the
   TF-IDF/embedding comparison far better than comparing slugs like `sk-excel`;
2. the response can return human-readable skill names straight to the UI.

Keep this in sync with the TypeScript catalogue (or replace both with a lookup
against the `Skill` table once you switch `DATA_SOURCE=postgres`).
"""

from __future__ import annotations

SKILLS: dict[str, tuple[str, str]] = {
    "sk-computer-basics": ("Computer Basics", "Digital"),
    "sk-ms-office": ("MS Office", "Digital"),
    "sk-excel": ("Excel", "Office & Accounts"),
    "sk-data-entry": ("Data Entry", "Digital"),
    "sk-typing": ("Typing (Hindi/English)", "Digital"),
    "sk-tally": ("Tally Prime", "Office & Accounts"),
    "sk-gst": ("GST", "Office & Accounts"),
    "sk-payroll": ("Payroll Management", "Office & Accounts"),
    "sk-accounting": ("Accounting", "Office & Accounts"),
    "sk-financial-literacy": ("Financial Literacy", "Office & Accounts"),
    "sk-digital-payments": ("Digital Payments (UPI)", "Digital"),
    "sk-cyber-safety": ("Cyber Safety", "Digital"),
    "sk-farming": ("Farming", "Agriculture"),
    "sk-organic-farming": ("Organic Farming", "Agriculture"),
    "sk-horticulture": ("Horticulture", "Agriculture"),
    "sk-dairy": ("Dairy & Animal Husbandry", "Agriculture"),
    "sk-poultry": ("Poultry Farming", "Agriculture"),
    "sk-fishery": ("Fishery", "Agriculture"),
    "sk-electrical": ("Electrical Work", "Trades"),
    "sk-plumbing": ("Plumbing", "Trades"),
    "sk-welding": ("Welding", "Trades"),
    "sk-carpentry": ("Carpentry", "Trades"),
    "sk-masonry": ("Masonry", "Trades"),
    "sk-solar-installation": ("Solar Panel Installation", "Trades"),
    "sk-ac-repair": ("AC & Refrigeration Repair", "Trades"),
    "sk-two-wheeler-repair": ("Two-Wheeler Repair", "Trades"),
    "sk-driving": ("Driving (LMV)", "Logistics"),
    "sk-tailoring": ("Tailoring", "Manufacturing"),
    "sk-handicraft": ("Handicraft & Handloom", "Manufacturing"),
    "sk-programming": ("Programming", "IT & Software"),
    "sk-web-development": ("Web Development", "IT & Software"),
    "sk-database": ("Database (SQL)", "IT & Software"),
    "sk-cyber-security": ("Cyber Security Basics", "IT & Software"),
    "sk-graphic-design": ("Graphic Design", "IT & Software"),
    "sk-bpo-support": ("Customer Support / BPO", "Retail & Services"),
    "sk-retail-sales": ("Retail Sales", "Retail & Services"),
    "sk-hospitality": ("Hospitality & Housekeeping", "Retail & Services"),
    "sk-cooking": ("Cooking / Food Processing", "Retail & Services"),
    "sk-beauty-wellness": ("Beauty & Wellness", "Retail & Services"),
    "sk-security-services": ("Security Guard Services", "Retail & Services"),
    "sk-health-worker": ("Community Health Work", "Healthcare"),
    "sk-pharmacy-assistant": ("Pharmacy Assistant", "Healthcare"),
    "sk-childcare": ("Child Care & Anganwadi", "Healthcare"),
    "sk-communication": ("Communication", "Communication"),
    "sk-hindi": ("Hindi Language", "Communication"),
    "sk-english": ("English Language", "Communication"),
    "sk-odiya": ("Odia Language", "Communication"),
    "sk-leadership": ("Team Leadership", "Communication"),
    "sk-interview-skills": ("Interview Readiness", "Communication"),
    "sk-resume-writing": ("Resume Writing", "Communication"),
    "sk-entrepreneurship": ("Entrepreneurship", "Communication"),
    "sk-marketing": ("Digital Marketing", "IT & Software"),
}


def skill_name(skill_id: str) -> str:
    """Display name for a skill id, falling back to the raw id."""
    entry = SKILLS.get(skill_id)
    return entry[0] if entry else skill_id


def skill_category(skill_id: str) -> str:
    entry = SKILLS.get(skill_id)
    return entry[1] if entry else "Other"


def suggest_area(skill_id: str) -> str:
    """Rough training area used in explanations (Office/Trades/etc.)."""
    return skill_category(skill_id)

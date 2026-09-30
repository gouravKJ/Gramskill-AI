import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names while resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Indian-format currency, e.g. 15000 -> "₹15,000". */
export function formatINR(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    if (value >= 10_000_000) return `₹${trimZero(value / 10_000_000)}Cr`;
    if (value >= 100_000) return `₹${trimZero(value / 100_000)}L`;
    if (value >= 1_000) return `₹${trimZero(value / 1_000)}K`;
  }
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(value))}`;
}

export function formatSalaryRange(min: number | null, max: number | null) {
  if (min == null && max == null) return "Not disclosed";
  if (min != null && max != null) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR((min ?? max) as number);
}

function trimZero(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatDate(input: string | Date | null | undefined, withTime = false) {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function relativeDays(input: string | Date, now = new Date()) {
  const date = typeof input === "string" ? new Date(input) : input;
  const diff = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Turn an enum value like `UNDER_REVIEW` into `Under Review`. */
export function labelEnum(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function titleCase(input: string) {
  return input
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return clamp(Math.round((part / total) * 100), 0, 100);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Haversine distance in kilometres — used by the local opportunity map. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

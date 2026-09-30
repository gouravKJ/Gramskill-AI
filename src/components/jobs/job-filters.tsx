"use client";

import * as React from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox, Separator } from "@/components/ui/misc";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/dialog";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet-parts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SKILL_CATALOGUE, locationById } from "@/lib/data/catalogue";
import type { JobFilters, JobType, Location, OpportunitySource, Skill, WorkMode } from "@/types";

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "APPRENTICESHIP", label: "Apprenticeship" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "GIG", label: "Gig / piece work" },
];

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "ONSITE", label: "On-site" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "FIELD", label: "Field work" },
];

const SOURCES: { value: OpportunitySource; label: string }[] = [
  { value: "PRIVATE", label: "Private employer" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "APPRENTICESHIP", label: "Apprenticeship" },
  { value: "SELF_EMPLOYMENT", label: "Self-employment" },
  { value: "LOCAL", label: "Local / cooperative" },
];

export interface JobFilterState extends JobFilters {}

export function JobFilters({
  value,
  onChange,
  locations,
  resultCount,
  loading,
}: {
  value: JobFilterState;
  onChange: (next: JobFilterState) => void;
  locations: Location[];
  resultCount: number;
  loading?: boolean;
}) {
  const [query, setQuery] = React.useState(value.query ?? "");
  const [skillQuery, setSkillQuery] = React.useState("");

  // Debounce the free-text search so we do not re-render on every keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== (value.query ?? "")) onChange({ ...value, query, page: 1 });
    }, 320);
    return () => clearTimeout(timer);
  }, [query, onChange, value]);

  const activeCount =
    (value.skills?.length ?? 0) +
    (value.locationIds?.length ?? 0) +
    (value.jobTypes?.length ?? 0) +
    (value.workModes?.length ?? 0) +
    (value.sources?.length ?? 0) +
    (value.minSalary ? 1 : 0) +
    (value.maxDistanceKm ? 1 : 0) +
    (value.ruralFriendlyOnly ? 1 : 0);

  const toggleArray = <K extends "skills" | "locationIds" | "jobTypes" | "workModes" | "sources">(
    key: K,
    item: string,
  ) => {
    const current = (value[key] as string[] | undefined) ?? [];
    const next = current.includes(item) ? current.filter((v) => v !== item) : [...current, item];
    onChange({ ...value, [key]: next, page: 1 } as JobFilterState);
  };

  const reset = () => {
    setQuery("");
    onChange({ query: "", page: 1, sort: value.sort });
  };

  const filteredSkills = React.useMemo(() => {
    const needle = skillQuery.trim().toLowerCase();
    const list = needle
      ? SKILL_CATALOGUE.filter((s) => s.name.toLowerCase().includes(needle) || s.aliases.some((a) => a.includes(needle)))
      : SKILL_CATALOGUE;
    return list.slice(0, 18);
  }, [skillQuery]);

  const panel = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Required skills
        </Label>
        <Input
          value={skillQuery}
          onChange={(event) => setSkillQuery(event.target.value)}
          placeholder="Search skills…"
          className="h-9 text-sm"
          aria-label="Search skills"
        />
        <div className="flex flex-wrap gap-1.5">
          {filteredSkills.map((skill: Skill) => {
            const selected = value.skills?.includes(skill.id);
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleArray("skills", skill.id)}
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {skill.name}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Job type
        </Label>
        <div className="grid gap-2">
          {JOB_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={value.jobTypes?.includes(type.value) ?? false}
                onCheckedChange={() => toggleArray("jobTypes", type.value)}
              />
              {type.label}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Work mode
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {WORK_MODES.map((mode) => (
            <label key={mode.value} className="flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={value.workModes?.includes(mode.value) ?? false}
                onCheckedChange={() => toggleArray("workModes", mode.value)}
              />
              {mode.label}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Opportunity source
        </Label>
        <div className="grid gap-2">
          {SOURCES.map((source) => (
            <label key={source.value} className="flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={value.sources?.includes(source.value) ?? false}
                onCheckedChange={() => toggleArray("sources", source.value)}
              />
              {source.label}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="distance" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Maximum distance
        </Label>
        <Select
          value={String(value.maxDistanceKm ?? "any")}
          onValueChange={(next) =>
            onChange({ ...value, maxDistanceKm: next === "any" ? undefined : Number(next), page: 1 })
          }
        >
          <SelectTrigger id="distance" className="h-9">
            <SelectValue placeholder="Any distance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any distance</SelectItem>
            <SelectItem value="10">Within 10 km</SelectItem>
            <SelectItem value="25">Within 25 km</SelectItem>
            <SelectItem value="50">Within 50 km</SelectItem>
            <SelectItem value="100">Within 100 km</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minSalary" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Minimum monthly salary (₹)
        </Label>
        <Input
          id="minSalary"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="e.g. 15000"
          className="h-9"
          value={value.minSalary ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              minSalary: event.target.value ? Number(event.target.value) : undefined,
              page: 1,
            })
          }
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Preferred location
        </Label>
        <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
          {locations
            .filter((l) => l.id !== "loc-remote")
            .map((location) => (
              <label key={location.id} className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={value.locationIds?.includes(location.id) ?? false}
                  onCheckedChange={() => toggleArray("locationIds", location.id)}
                />
                <span className="truncate">
                  {location.name}
                  <span className="ml-1 text-xs text-muted-foreground">{location.district}</span>
                </span>
              </label>
            ))}
        </div>
      </div>

      <Separator />

      <label className="flex items-start gap-2.5 text-sm">
        <Checkbox
          checked={value.ruralFriendlyOnly ?? false}
          onCheckedChange={(checked) =>
            onChange({ ...value, ruralFriendlyOnly: checked === true ? true : undefined, page: 1 })
          }
          className="mt-0.5"
        />
        <span>
          Rural-friendly employers only
          <span className="block text-xs text-muted-foreground">
            Employers who explicitly hire from rural areas.
          </span>
        </span>
      </label>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search job title, employer, sector…"
            className="pl-9"
            aria-label="Search jobs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={value.sort ?? "recent"}
            onValueChange={(next) => onChange({ ...value, sort: next as JobFilters["sort"], page: 1 })}
          >
            <SelectTrigger className="w-40" aria-label="Sort jobs">
              <SlidersHorizontal className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="salary">Highest salary</SelectItem>
              <SelectItem value="relevance">Title (A–Z)</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="size-4" />
                Filters
                {activeCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 px-1.5 text-[10px]">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter jobs</SheetTitle>
              </SheetHeader>
              {panel}
              <Button className="w-full" onClick={reset}>
                <RotateCcw className="size-4" /> Clear all filters
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span aria-live="polite">
          {loading ? "Matching…" : `${resultCount} job${resultCount === 1 ? "" : "s"} found`}
        </span>
        {activeCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{activeCount} filter{activeCount === 1 ? "" : "s"} active</span>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={reset}>
              <RotateCcw className="size-3" />
              Reset
            </Button>
          </>
        )}
        {value.locationIds?.map((id) => (
          <Badge key={id} variant="muted" className="gap-1">
            {locationById(id).name}
            <button
              type="button"
              onClick={() => toggleArray("locationIds", id)}
              aria-label={`Remove ${locationById(id).name} filter`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">{panel}</div>
      </div>
    </div>
  );
}

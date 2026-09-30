"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { BarChart3 } from "lucide-react";
import type { Application, Skill } from "@/types";

/**
 * Recharts visualisations for the dashboard and admin analytics.
 *
 * All series are computed from the user's own records (or, for the admin
 * views, the whole dataset) — never from hard-coded illustrative numbers.
 * Low-bandwidth mode still renders these; they are SVG and cost a few KB.
 */

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip() {
  return (
    <Tooltip
      contentStyle={{
        background: "hsl(var(--popover))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "0.75rem",
        fontSize: "12px",
        boxShadow: "var(--shadow-lift)",
      }}
      labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
    />
  );
}

export function SkillDistributionChart({
  skills,
}: {
  skills: { skillId: string; name: string; proficiency: string; category: string }[];
}) {
  const data = React.useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const skill of skills) {
      const weight = skill.proficiency === "ADVANCED" ? 3 : skill.proficiency === "INTERMEDIATE" ? 2 : 1;
      byCategory.set(skill.category, (byCategory.get(skill.category) ?? 0) + weight);
    }
    return [...byCategory.entries()].map(([name, value]) => ({ name, value }));
  }, [skills]);

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skill distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<BarChart3 className="size-5" />}
            title="No skills yet"
            description="Add your skills in the profile to see how they are distributed across categories."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Skill distribution</CardTitle>
        <CardDescription>Weighted by your proficiency level in each category.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={44}
                outerRadius={78}
                paddingAngle={3}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_LABEL: Record<string, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  UNDER_REVIEW: "Under review",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  REJECTED: "Rejected",
};

export function ApplicationStatusChart({ applications }: { applications: Application[] }) {
  const data = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const application of applications) {
      counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
    }
    return ["SAVED", "APPLIED", "UNDER_REVIEW", "INTERVIEW", "SELECTED", "REJECTED"]
      .map((status) => ({ status, label: STATUS_LABEL[status] ?? status, count: counts.get(status) ?? 0 }))
      .filter((entry) => entry.count > 0);
  }, [applications]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Application status</CardTitle>
        <CardDescription>
          {applications.length} application{applications.length === 1 ? "" : "s"} in your pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="size-5" />}
            title="No applications yet"
            description="Save or apply to a job and your pipeline will show up here."
          />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" {...axisProps} interval={0} angle={-18} textAnchor="end" height={48} />
                <YAxis allowDecimals={false} {...axisProps} />
                <ChartTooltip />
                <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {data.map((entry, index) => (
                    <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CareerProgressChart({
  points,
}: {
  points: { label: string; matchScore: number; skills: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Career progress</CardTitle>
        <CardDescription>
          How your match score and skill count change as you complete training steps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="matchGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="skillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} />
              <ChartTooltip />
              <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" />
              <Area
                type="monotone"
                dataKey="matchScore"
                name="Match score (%)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#matchGradient)"
              />
              <Area
                type="monotone"
                dataKey="skills"
                name="Skills count"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                fill="url(#skillGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generic category/funnel bar chart.
 * Takes pre-aggregated counts so admin views can chart analytics directly
 * instead of re-deriving them from raw records.
 */
export function FunnelChart({
  data,
  title = "Application status",
  description,
}: {
  data: { label: string; count: number }[];
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState icon={<BarChart3 className="size-5" />} title="No data yet" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  {...axisProps}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={48}
                />
                <YAxis allowDecimals={false} {...axisProps} />
                <ChartTooltip />
                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {data.map((entry, index) => (
                    <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SkillGapRadial({
  data,
}: {
  data: { label: string; coverage: number }[];
}) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="35%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="coverage" background cornerRadius={6}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </RadialBar>
          <ChartTooltip />
          <Legend
            verticalAlign="bottom"
            height={30}
            iconType="circle"
            wrapperStyle={{ fontSize: "11px" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrainingProgressList({
  items,
}: {
  items: { title: string; progress: number; status: string }[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.title}>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium">{item.title}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{item.progress}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{item.status}</p>
        </li>
      ))}
    </ul>
  );
}

export type { Skill };

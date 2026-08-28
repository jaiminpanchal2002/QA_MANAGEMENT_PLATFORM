"use client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  PASSED: "hsl(142 71% 45%)",
  FAILED: "hsl(0 72% 51%)",
  BLOCKED: "hsl(38 92% 50%)",
  SKIPPED: "hsl(215 16% 47%)",
  NOT_EXECUTED: "hsl(214 32% 80%)",
  ACTIVE: "hsl(142 71% 45%)",
  DRAFT: "hsl(215 16% 47%)",
  DEPRECATED: "hsl(38 92% 50%)",
  ARCHIVED: "hsl(214 32% 80%)",
};

const SEVERITY_COLORS: Record<string, string> = {
  BLOCKER: "hsl(0 72% 40%)",
  CRITICAL: "hsl(0 72% 51%)",
  MAJOR: "hsl(38 92% 50%)",
  MINOR: "hsl(48 92% 55%)",
  TRIVIAL: "hsl(215 16% 55%)",
};

export function ExecutionTrendChart({
  data,
}: {
  data: Array<{ date: string; passed: number; failed: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="passed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="failed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="passed"
          stroke="hsl(142 71% 45%)"
          fill="url(#passed)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="failed"
          stroke="hsl(0 72% 51%)"
          fill="url(#failed)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({
  data,
}: {
  data: Array<{ status: string; count: number }>;
}) {
  if (data.length === 0)
    return <EmptyChart label="No execution data yet" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? "hsl(215 16% 55%)"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DefectSeverityChart({
  data,
}: {
  data: Array<{ severity: string; count: number }>;
}) {
  if (data.length === 0) return <EmptyChart label="No defects logged" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <XAxis
          dataKey="severity"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(s: string) => s.slice(0, 4)}
        />
        <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.severity}
              fill={SEVERITY_COLORS[entry.severity] ?? "hsl(215 16% 55%)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

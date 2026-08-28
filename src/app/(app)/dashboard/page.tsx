import type { Metadata } from "next";
import {
  FileText,
  CheckCircle2,
  Bug,
  Bot,
  Activity,
  PlayCircle,
} from "lucide-react";
import { getDashboardMetrics } from "@/features/dashboard/service";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DefectSeverityChart,
  ExecutionTrendChart,
  StatusDonut,
} from "@/components/dashboard/charts";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const EXEC_COLORS: Record<string, string> = {
  PASSED: "hsl(142 71% 45%)",
  FAILED: "hsl(0 72% 51%)",
  BLOCKED: "hsl(38 92% 50%)",
  SKIPPED: "hsl(215 16% 47%)",
  NOT_EXECUTED: "hsl(214 32% 80%)",
};

export default async function DashboardPage() {
  const m = await getDashboardMetrics();

  const execDistribution = [
    { status: "PASSED", count: m.execution.passed },
    { status: "FAILED", count: m.execution.failed },
    { status: "BLOCKED", count: m.execution.blocked },
    { status: "SKIPPED", count: m.execution.skipped },
    { status: "NOT_EXECUTED", count: m.execution.notExecuted },
  ].filter((d) => d.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live quality metrics across your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Test cases"
          value={m.totals.testCases}
          icon={FileText}
          hint={`${m.totals.projects} project${m.totals.projects === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Pass rate"
          value={`${m.execution.passRate}%`}
          icon={CheckCircle2}
          accent="success"
          hint={`${m.execution.passed} passed / ${m.execution.total} total`}
        />
        <StatCard
          label="Open defects"
          value={m.totals.openDefects}
          icon={Bug}
          accent="destructive"
        />
        <StatCard
          label="Automation coverage"
          value={`${m.totals.automationCoverage}%`}
          icon={Bot}
          accent="warning"
          hint={`${m.totals.automatedTestCases} automated`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Execution trend (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutionTrendChart data={m.executionTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={execDistribution} />
            {execDistribution.length > 0 && (
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {execDistribution.map((d) => (
                  <li
                    key={d.status}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ background: EXEC_COLORS[d.status] }}
                      />
                      <span className="truncate text-muted-foreground">
                        {d.status.replace("_", " ").toLowerCase()}
                      </span>
                    </span>
                    <span className="tabular-nums font-medium">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Defects by severity</CardTitle>
          </CardHeader>
          <CardContent>
            <DefectSeverityChart data={m.defectsBySeverity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PlayCircle className="h-4 w-4" /> Recent test runs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {m.recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              m.recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate text-sm">{run.name}</span>
                  <Badge variant={runVariant(run.status)}>{run.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {m.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Activity will appear here.
              </p>
            ) : (
              m.recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <span className="font-medium">{a.action}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function runVariant(
  status: string
): "default" | "success" | "destructive" | "warning" | "secondary" {
  if (status === "PASSED" || status === "COMPLETED") return "success";
  if (status === "FAILED") return "destructive";
  if (status === "BLOCKED" || status === "RUNNING") return "warning";
  if (status === "CANCELLED") return "secondary";
  return "default";
}

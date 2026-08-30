import type { Metadata } from "next";
import Link from "next/link";
import { FileText, CheckCircle2, Bug, Bot, FolderKanban } from "lucide-react";
import { getReportsData } from "@/features/reports/service";
import { ReportsToolbar } from "@/features/reports/reports-toolbar";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  DefectSeverityChart,
  ExecutionTrendChart,
  StatusDonut,
} from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const EXEC_COLORS: Record<string, string> = {
  PASSED: "hsl(142 71% 45%)",
  FAILED: "hsl(0 72% 51%)",
  BLOCKED: "hsl(38 92% 50%)",
  SKIPPED: "hsl(215 16% 47%)",
  NOT_EXECUTED: "hsl(214 32% 80%)",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;
  const { metrics: m, projects, allProjects, selectedProjectId, selectedProjectName } =
    await getReportsData(projectId);

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
        title="Reports"
        description={
          selectedProjectName
            ? `Analytics for ${selectedProjectName} — coverage, execution and defects.`
            : "QA analytics — coverage, execution and defects across your organization."
        }
        actions={
          <ReportsToolbar
            allProjects={allProjects}
            selectedProjectId={selectedProjectId}
            rows={projects}
          />
        }
      />

      {/* Headline KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Test cases"
          value={m.totals.testCases}
          icon={FileText}
          hint={`${m.totals.projects} project${m.totals.projects === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Overall pass rate"
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

      {/* Execution reporting */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Execution trend (14 days)</CardTitle>
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
                    <span className="font-medium tabular-nums">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Defect reporting */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Defects by severity</CardTitle>
          </CardHeader>
          <CardContent>
            <DefectSeverityChart data={m.defectsBySeverity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Defects by status</CardTitle>
          </CardHeader>
          <CardContent>
            {m.defectsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No defects logged.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {m.defectsByStatus.map((d) => (
                  <li
                    key={d.status}
                    className="flex items-center justify-between gap-2"
                  >
                    <Badge variant={defectStatusVariant(d.status)}>
                      {d.status.replace("_", " ")}
                    </Badge>
                    <span className="font-medium tabular-nums">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-project report table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-project report</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FolderKanban}
                title="No projects to report on yet"
                description="Create a project and start authoring test cases to see reporting here."
                action={
                  <Button asChild>
                    <Link href="/projects">Go to Projects</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Test cases</TableHead>
                    <TableHead className="text-right">Automation</TableHead>
                    <TableHead className="text-right">Executed</TableHead>
                    <TableHead>Pass rate</TableHead>
                    <TableHead className="text-right">Open defects</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${p.id}`}
                          className="flex items-center gap-2 font-medium hover:underline"
                        >
                          <Badge variant="secondary" className="font-mono">
                            {p.key}
                          </Badge>
                          <span className="truncate">{p.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.testCases}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {p.automationCoverage}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {p.executed}
                      </TableCell>
                      <TableCell>
                        <PassRateBar rate={p.passRate} executed={p.executed} />
                      </TableCell>
                      <TableCell className="text-right">
                        {p.openDefects > 0 ? (
                          <Badge variant="destructive">{p.openDefects}</Badge>
                        ) : (
                          <span className="tabular-nums text-muted-foreground">
                            0
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Compact pass-rate meter with a threshold color. */
function PassRateBar({ rate, executed }: { rate: number; executed: number }) {
  if (executed === 0) {
    return <span className="text-xs text-muted-foreground">Not run</span>;
  }
  const color =
    rate >= 80
      ? "hsl(142 71% 45%)"
      : rate >= 50
        ? "hsl(38 92% 50%)"
        : "hsl(0 72% 51%)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, background: color }}
        />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums">
        {rate}%
      </span>
    </div>
  );
}

function defectStatusVariant(
  status: string
): "default" | "success" | "destructive" | "warning" | "secondary" {
  if (status === "OPEN" || status === "REOPENED") return "destructive";
  if (status === "IN_PROGRESS") return "warning";
  if (status === "RESOLVED" || status === "CLOSED") return "success";
  return "secondary";
}

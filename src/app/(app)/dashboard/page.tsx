import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  MailPlus,
  Bug,
  Activity,
  PlayCircle,
  BarChart3,
  Plus,
  CheckCircle2,
  Bot,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDashboardMetrics } from "@/features/dashboard/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await getDashboardMetrics();
  const noData = m.totals.projects === 0 && m.totals.testCases === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your organization at a glance — what's happening right now."
        actions={
          <Button asChild size="sm">
            <Link href="/reports">
              <BarChart3 className="h-4 w-4" /> View reports
            </Link>
          </Button>
        }
      />

      {/* Operational KPIs (people & work) — distinct from the QA analytics on
          the Reports page. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          index={0}
          label="Projects"
          value={m.totals.projects}
          icon={<FolderKanban />}
          hint={`${m.totals.testCases} test case${m.totals.testCases === 1 ? "" : "s"}`}
        />
        <KpiCard
          index={1}
          label="Members"
          value={m.totals.members}
          icon={<Users />}
          accent="default"
          hint="in this organization"
        />
        <KpiCard
          index={2}
          label="Pending invites"
          value={m.totals.pendingInvitations}
          icon={<MailPlus />}
          accent="warning"
          hint="awaiting acceptance"
        />
        <KpiCard
          index={3}
          label="Open defects"
          value={m.totals.openDefects}
          icon={<Bug />}
          accent="destructive"
          hint="need attention"
        />
      </div>

      {noData && (
        <EmptyState
          icon={FolderKanban}
          title="Let's get your workspace started"
          description="Create your first project, then add test cases and run them — your live metrics will appear here."
          action={
            <Button asChild>
              <Link href="/projects">
                <Plus className="h-4 w-4" /> Create a project
              </Link>
            </Button>
          }
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick actions */}
        <Card
          className="animate-rise"
          style={{ animationDelay: "280ms" }}
        >
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QuickAction href="/projects" icon={Plus} label="New project" />
            <QuickAction
              href="/settings"
              icon={MailPlus}
              label="Invite a member"
            />
            <QuickAction
              href="/test-runs"
              icon={PlayCircle}
              label="Start a test run"
            />
            <QuickAction
              href="/reports"
              icon={BarChart3}
              label="Open reports"
            />
          </CardContent>
        </Card>

        {/* Execution snapshot */}
        <Card className="animate-rise" style={{ animationDelay: "340ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-success" /> Execution health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MeterRow
              label="Pass rate"
              value={m.execution.passRate}
              tone="rate"
            />
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <MiniStat label="Passed" value={m.execution.passed} tone="success" />
              <MiniStat label="Failed" value={m.execution.failed} tone="destructive" />
              <MiniStat label="Runs" value={m.totals.testRuns} />
            </div>
          </CardContent>
        </Card>

        {/* Coverage snapshot */}
        <Card className="animate-rise" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-warning-foreground" /> Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MeterRow
              label="Automation"
              value={m.totals.automationCoverage}
              tone="warning"
            />
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <MiniStat label="Test cases" value={m.totals.testCases} />
              <MiniStat
                label="Automated"
                value={m.totals.automatedTestCases}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity — the "what just happened" feed */}
        <Card
          className="animate-rise lg:col-span-2"
          style={{ animationDelay: "460ms" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {m.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Activity from your team will appear here.
              </p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-4">
                {m.recentActivity.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                    <p className="text-sm font-medium">
                      {formatActivity(a.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Recent runs */}
        <Card className="animate-rise" style={{ animationDelay: "520ms" }}>
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
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="group justify-between"
    >
      <Link href={href}>
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" /> {label}
        </span>
        <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}

function MeterRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "rate" | "warning";
}) {
  const color =
    tone === "warning"
      ? "hsl(38 92% 50%)"
      : value >= 80
        ? "hsl(142 71% 45%)"
        : value >= 50
          ? "hsl(38 92% 50%)"
          : "hsl(0 72% 51%)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "destructive";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-md bg-secondary/40 py-2">
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/** "testcase.executed" → "Test case executed". */
function formatActivity(action: string): string {
  const text = action.replace(/[._]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
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

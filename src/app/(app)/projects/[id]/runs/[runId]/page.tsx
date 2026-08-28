import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { isAppError } from "@/lib/errors";
import { getRunService } from "@/features/test-runs/service";
import { PageHeader } from "@/components/shell/page-header";
import { RunActions } from "@/features/test-runs/run-actions";
import { RunStatusBadge } from "@/features/test-runs/run-status-badge";
import { ExecutionControls } from "@/features/test-runs/execution-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Test Run" };
export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;

  let data;
  try {
    data = await getRunService(id, runId);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const { run, executions } = data;

  const counts = {
    PASSED: 0,
    FAILED: 0,
    BLOCKED: 0,
    SKIPPED: 0,
    NOT_EXECUTED: 0,
  } as Record<string, number>;
  for (const e of executions) counts[e.status] = (counts[e.status] ?? 0) + 1;
  const total = executions.length;
  const executed = total - (counts.NOT_EXECUTED ?? 0);
  const progress = percent(executed, total);
  const passRate = percent(counts.PASSED ?? 0, executed);
  const isTerminal = run.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/projects/${id}/runs`}>
          <ChevronLeft className="h-4 w-4" /> Test Runs
        </Link>
      </Button>

      <PageHeader
        title={run.name}
        description={run.environment ? `Environment: ${run.environment}` : undefined}
        actions={<RunActions projectId={id} runId={runId} isTerminal={isTerminal} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <RunStatusBadge status={run.status} />
        {run.isAutomated === "true" && (
          <Badge variant="secondary">
            Automated{run.provider ? ` · ${run.provider}` : " · Simulated"}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progress — {executed}/{total} executed
            </span>
            <span className="font-medium">Pass rate {passRate}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Stat label="Passed" value={counts.PASSED ?? 0} className="text-success" />
            <Stat label="Failed" value={counts.FAILED ?? 0} className="text-destructive" />
            <Stat label="Blocked" value={counts.BLOCKED ?? 0} className="text-warning-foreground" />
            <Stat label="Skipped" value={counts.SKIPPED ?? 0} />
            <Stat label="Pending" value={counts.NOT_EXECUTED ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Record</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {e.caseReference}
                    </Badge>
                    <span className="font-medium">{e.caseTitle}</span>
                  </div>
                  {e.status === "FAILED" && e.errorMessage && (
                    <p className="mt-1 text-xs text-destructive">
                      {e.errorMessage}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <RunStatusBadge status={e.status} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <ExecutionControls
                      projectId={id}
                      runId={runId}
                      executionId={e.id}
                      current={e.status}
                      disabled={isTerminal}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`font-semibold tabular-nums ${className ?? ""}`}>
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

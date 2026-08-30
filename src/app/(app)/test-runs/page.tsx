import type { Metadata } from "next";
import Link from "next/link";
import { PlayCircle, Bot, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getRunActivity } from "@/features/workspace/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { FilterSelect } from "@/components/shell/filter-select";
import { Pagination } from "@/components/shell/pagination";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Test Runs" };
export const dynamic = "force-dynamic";

export default async function TestRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const { rows, meta } = await getRunActivity(sp);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Run Activity"
        description="Recent execution runs across your projects — manual and automated, newest first."
        actions={
          <FilterSelect
            param="status"
            value={sp.status}
            placeholder="All statuses"
            options={[
              { value: "RUNNING", label: "Running" },
              { value: "QUEUED", label: "Queued" },
              { value: "PASSED", label: "Passed" },
              { value: "FAILED", label: "Failed" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title={sp.status ? "No runs with that status" : "No test runs yet"}
          description="Open a project and start a run — execution activity shows up here."
        />
      ) : (
        <>
          <div className="space-y-3">
            {rows.map((run) => {
              const rate =
                run.totalExecutions > 0
                  ? Math.round((run.passed / run.totalExecutions) * 100)
                  : 0;
              return (
                <Link
                  key={run.id}
                  href={`/projects/${run.projectId}/runs/${run.id}`}
                  className="group block"
                >
                  <Card className="p-4 transition-colors group-hover:border-primary/40">
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <PlayCircle className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium">
                            {run.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {run.projectKey}
                          </Badge>
                          {run.isAutomated === "true" && (
                            <Badge variant="outline" className="gap-1">
                              <Bot className="h-3 w-3" /> auto
                            </Badge>
                          )}
                          {run.environment && (
                            <span className="text-xs text-muted-foreground">
                              {run.environment}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(run.createdAt), {
                            addSuffix: true,
                          })}
                          {run.totalExecutions > 0 &&
                            ` · ${run.passed}/${run.totalExecutions} passed`}
                        </p>
                      </div>

                      {/* Per-run pass-rate meter */}
                      <div className="hidden w-40 shrink-0 sm:block">
                        {run.totalExecutions > 0 ? (
                          <>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Pass rate
                              </span>
                              <span className="font-medium tabular-nums">
                                {rate}%
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${rate}%`,
                                  background:
                                    rate >= 80
                                      ? "hsl(142 71% 45%)"
                                      : rate >= 50
                                        ? "hsl(38 92% 50%)"
                                        : "hsl(0 72% 51%)",
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not executed
                          </span>
                        )}
                      </div>

                      <Badge
                        variant={runVariant(run.status)}
                        className="shrink-0"
                      >
                        {run.status.replace("_", " ")}
                      </Badge>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
          {meta.total > meta.pageSize && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
            />
          )}
        </>
      )}
    </div>
  );
}

function runVariant(
  status: string
): "default" | "success" | "destructive" | "warning" | "secondary" {
  if (status === "PASSED" || status === "COMPLETED") return "success";
  if (status === "FAILED") return "destructive";
  if (status === "BLOCKED" || status === "RUNNING" || status === "QUEUED")
    return "warning";
  if (status === "CANCELLED") return "secondary";
  return "default";
}

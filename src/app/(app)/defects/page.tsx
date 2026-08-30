import type { Metadata } from "next";
import Link from "next/link";
import { Bug } from "lucide-react";
import { format } from "date-fns";
import { getDefectTriage } from "@/features/workspace/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { SearchInput } from "@/components/shell/search-input";
import { FilterSelect } from "@/components/shell/filter-select";
import { Pagination } from "@/components/shell/pagination";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Defects" };
export const dynamic = "force-dynamic";

const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "REOPENED", "RESOLVED", "CLOSED"];

export default async function DefectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    severity?: string;
  }>;
}) {
  const sp = await searchParams;
  const { rows, summary, meta } = await getDefectTriage(sp);
  const filtered = Boolean(sp.search || sp.status || sp.severity);

  const summaryMap = new Map<string, number>(
    summary.map((s) => [s.status, s.c])
  );
  const totalDefects = summary.reduce((n, s) => n + s.c, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Defect Triage"
        description="Every defect across your organization, newest first — filter by status or severity to work your queue."
      />

      {/* Status summary strip — click a status to filter the queue below. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_ORDER.map((status) => {
          const count = summaryMap.get(status) ?? 0;
          const active = sp.status === status;
          return (
            <Link
              key={status}
              href={active ? "/defects" : `/defects?status=${status}`}
              className={`rounded-lg border p-3 transition-colors hover:border-primary/40 ${
                active ? "border-primary/60 bg-primary/5" : "bg-card"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: statusColor(status) }}
                />
                <span className="text-xs text-muted-foreground">
                  {status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">{count}</p>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <SearchInput placeholder="Search by title or reference…" />
        </div>
        <FilterSelect
          param="severity"
          value={sp.severity}
          placeholder="All severities"
          options={[
            { value: "BLOCKER", label: "Blocker" },
            { value: "CRITICAL", label: "Critical" },
            { value: "MAJOR", label: "Major" },
            { value: "MINOR", label: "Minor" },
            { value: "TRIVIAL", label: "Trivial" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Bug}
          title={
            filtered
              ? "No defects match your filters"
              : totalDefects === 0
                ? "No defects logged"
                : "Nothing here"
          }
          description={
            filtered
              ? "Try clearing filters or a different search term."
              : "Defects logged against failed tests will appear here for triage."
          }
        />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {d.reference}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate font-medium">
                        <Link
                          href={`/projects/${d.projectId}`}
                          className="hover:underline"
                        >
                          {d.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityVariant(d.severity)}>
                          {d.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-sm">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: statusColor(d.status) }}
                          />
                          {d.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="font-mono text-xs">{d.projectKey}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(d.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
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

function statusColor(status: string): string {
  switch (status) {
    case "OPEN":
    case "REOPENED":
      return "hsl(0 72% 51%)";
    case "IN_PROGRESS":
      return "hsl(38 92% 50%)";
    case "RESOLVED":
    case "CLOSED":
      return "hsl(142 71% 45%)";
    default:
      return "hsl(215 16% 55%)";
  }
}

function severityVariant(
  s: string
): "default" | "destructive" | "warning" | "secondary" {
  if (s === "BLOCKER" || s === "CRITICAL") return "destructive";
  if (s === "MAJOR") return "warning";
  if (s === "TRIVIAL") return "secondary";
  return "default";
}

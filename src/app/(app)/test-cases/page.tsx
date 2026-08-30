import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Bot } from "lucide-react";
import { getTestCaseLibrary } from "@/features/workspace/service";
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

export const metadata: Metadata = { title: "Test Cases" };
export const dynamic = "force-dynamic";

export default async function TestCasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    priority?: string;
  }>;
}) {
  const sp = await searchParams;
  const { rows, meta } = await getTestCaseLibrary(sp);
  const filtered = Boolean(sp.search || sp.status || sp.priority);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Case Library"
        description="Every test case across your organization — search, filter and open its project to edit."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-xs sm:flex-1">
          <SearchInput placeholder="Search by title or reference…" />
        </div>
        <div className="flex gap-2">
          <FilterSelect
            param="status"
            value={sp.status}
            placeholder="All statuses"
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "ACTIVE", label: "Active" },
              { value: "DEPRECATED", label: "Deprecated" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
          />
          <FilterSelect
            param="priority"
            value={sp.priority}
            placeholder="All priorities"
            options={[
              { value: "CRITICAL", label: "Critical" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filtered ? "No matching test cases" : "No test cases yet"}
          description={
            filtered
              ? "Try clearing filters or a different search term."
              : "Open a project to author your first test case — it'll appear in this library."
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
                    <TableHead>Project</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Auto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((tc) => (
                    <TableRow key={tc.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {tc.reference}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate font-medium">
                        <Link
                          href={`/projects/${tc.projectId}`}
                          className="hover:underline"
                        >
                          {tc.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="font-mono text-xs">{tc.projectKey}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant(tc.priority)}>
                          {tc.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tc.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tc.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {tc.automationStatus === "AUTOMATED" ? (
                          <Bot className="mx-auto h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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

function priorityVariant(
  p: string
): "default" | "destructive" | "warning" | "secondary" {
  if (p === "CRITICAL") return "destructive";
  if (p === "HIGH") return "warning";
  if (p === "LOW") return "secondary";
  return "default";
}

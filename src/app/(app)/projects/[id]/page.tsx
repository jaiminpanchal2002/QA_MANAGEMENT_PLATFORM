import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, ChevronLeft, Bug } from "lucide-react";
import { format } from "date-fns";
import { isAppError } from "@/lib/errors";
import { getProjectService } from "@/features/projects/service";
import { listTestCasesService } from "@/features/test-cases/service";
import { listDefectsService } from "@/features/defects/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { SearchInput } from "@/components/shell/search-input";
import { Pagination } from "@/components/shell/pagination";
import { CreateTestCaseDialog } from "@/features/test-cases/create-test-case-dialog";
import { CreateDefectDialog } from "@/features/defects/create-defect-dialog";
import { DefectStatusSelect } from "@/features/defects/defect-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Project" };
export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  let project;
  try {
    project = await getProjectService(id);
  } catch (error) {
    // 404 for cross-tenant / missing; anything else re-thrown.
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const { data: testCases, meta } = await listTestCasesService(id, {
    page: sp.page,
    search: sp.search,
  });

  const { data: defects, meta: defectMeta } = await listDefectsService(id, {
    pageSize: 25,
  });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/projects">
          <ChevronLeft className="h-4 w-4" /> Projects
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        description={project.description ?? "No description provided."}
        actions={<CreateTestCaseDialog projectId={id} />}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="font-mono">
          {project.key}
        </Badge>
        <Badge variant={project.status === "ACTIVE" ? "success" : "secondary"}>
          {project.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Created {format(new Date(project.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Test cases{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({meta.total})
          </span>
        </h2>
        <SearchInput placeholder="Search test cases…" />
      </div>

      {testCases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={sp.search ? "No matching test cases" : "No test cases yet"}
          description={
            sp.search
              ? "Try a different search term."
              : "Author your first test case to start building coverage."
          }
          action={!sp.search ? <CreateTestCaseDialog projectId={id} /> : undefined}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testCases.map((tc) => (
                <TableRow key={tc.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {tc.reference}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tc.title}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {meta.total > meta.pageSize && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
        />
      )}

      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-semibold">
          Defects{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({defectMeta.total})
          </span>
        </h2>
        <CreateDefectDialog projectId={id} />
      </div>

      {defects.length === 0 ? (
        <EmptyState
          icon={Bug}
          title="No defects logged"
          description="Log a defect when a test fails or a bug is found."
          action={<CreateDefectDialog projectId={id} />}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defects.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {d.reference}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>
                    <Badge variant={severityVariant(d.severity)}>
                      {d.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DefectStatusSelect
                      projectId={id}
                      defectId={d.id}
                      current={d.status}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(d.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function severityVariant(
  s: string
): "default" | "destructive" | "warning" | "secondary" {
  if (s === "BLOCKER" || s === "CRITICAL") return "destructive";
  if (s === "MAJOR") return "warning";
  if (s === "TRIVIAL") return "secondary";
  return "default";
}

function priorityVariant(
  p: string
): "default" | "destructive" | "warning" | "secondary" {
  if (p === "CRITICAL") return "destructive";
  if (p === "HIGH") return "warning";
  if (p === "LOW") return "secondary";
  return "default";
}

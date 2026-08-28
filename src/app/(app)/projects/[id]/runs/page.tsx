import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { isAppError } from "@/lib/errors";
import { getProjectService } from "@/features/projects/service";
import { listRunsService } from "@/features/test-runs/service";
import { listTestCasesService } from "@/features/test-cases/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { Pagination } from "@/components/shell/pagination";
import { CreateRunDialog } from "@/features/test-runs/create-run-dialog";
import { RunStatusBadge } from "@/features/test-runs/run-status-badge";
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

export const metadata: Metadata = { title: "Test Runs" };
export const dynamic = "force-dynamic";

export default async function ProjectRunsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  let project;
  try {
    project = await getProjectService(id);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const [{ data: runs, meta }, { data: cases }] = await Promise.all([
    listRunsService(id, { page: sp.page }),
    listTestCasesService(id, { pageSize: 100 }),
  ]);

  const caseOptions = cases.map((c) => ({
    id: c.id,
    reference: c.reference,
    title: c.title,
  }));

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/projects/${id}`}>
          <ChevronLeft className="h-4 w-4" /> {project.name}
        </Link>
      </Button>

      <PageHeader
        title="Test Runs"
        description="Execute test cases and record results."
        actions={<CreateRunDialog projectId={id} cases={caseOptions} />}
      />

      {runs.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No test runs yet"
          description={
            caseOptions.length === 0
              ? "Add test cases to this project first, then create a run."
              : "Create a run to start executing test cases."
          }
          action={
            caseOptions.length > 0 ? (
              <CreateRunDialog projectId={id} cases={caseOptions} />
            ) : undefined
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${id}/runs/${run.id}`}
                      className="hover:underline"
                    >
                      {run.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <RunStatusBadge status={run.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.environment ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(run.createdAt), "MMM d, yyyy")}
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
    </div>
  );
}

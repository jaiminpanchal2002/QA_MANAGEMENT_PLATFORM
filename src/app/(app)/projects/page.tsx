import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { listProjectsService } from "@/features/projects/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { SearchInput } from "@/components/shell/search-input";
import { Pagination } from "@/components/shell/pagination";
import { CreateProjectDialog } from "@/features/projects/create-project-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const { data: projects, meta } = await listProjectsService({
    page: sp.page,
    search: sp.search,
    status: sp.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Every test asset lives inside a project."
        actions={<CreateProjectDialog />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Search by name or key…" />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={sp.search ? "No projects match your search" : "No projects yet"}
          description={
            sp.search
              ? "Try a different search term."
              : "Create your first project to start authoring test cases."
          }
          action={!sp.search ? <CreateProjectDialog /> : undefined}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {project.key}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(project.createdAt), "MMM d, yyyy")}
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

function statusVariant(
  status: string
): "default" | "success" | "secondary" | "warning" {
  if (status === "ACTIVE") return "success";
  if (status === "ON_HOLD") return "warning";
  return "secondary";
}

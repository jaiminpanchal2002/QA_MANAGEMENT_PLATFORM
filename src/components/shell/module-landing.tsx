import Link from "next/link";
import { FolderKanban, ArrowRight } from "lucide-react";
import { listProjectsService } from "@/features/projects/service";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Landing for project-scoped modules (test cases, plans, runs, defects,
 * reports). These entities always live inside a project, so the module entry
 * point lists the org's projects and links into each. The per-project UI for
 * this module is reached from the project workspace.
 */
export async function ModuleLanding({
  title,
  description,
  note,
}: {
  title: string;
  description: string;
  note?: string;
}) {
  const { data: projects } = await listProjectsService({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {note && (
        <div className="rounded-md border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
          {note}
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project first — this module operates within a project."
          action={
            <Button asChild>
              <Link href="/projects">Go to Projects</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group">
              <Card className="transition-colors group-hover:border-primary/40">
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <Badge variant="secondary" className="mb-2 font-mono">
                      {p.key}
                    </Badge>
                    <p className="truncate font-medium">{p.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, FileText, PlayCircle, ArrowRight } from "lucide-react";
import { getPlanningOverview } from "@/features/workspace/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Test Plans" };
export const dynamic = "force-dynamic";

export default async function TestPlansPage() {
  const projects = await getPlanningOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Planning"
        description="Coverage at a glance — how much of each project is authored, active and executed."
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No projects to plan yet"
          description="Create a project first — planning organizes its test cases into release objectives."
          action={
            <Button asChild>
              <Link href="/projects">Go to Projects</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const activePct =
              p.testCases > 0 ? Math.round((p.active / p.testCases) * 100) : 0;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group block"
              >
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/5">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          {p.key}
                        </Badge>
                        <span className="truncate font-medium">{p.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>

                    {/* Active-vs-authored coverage meter */}
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Active coverage
                        </span>
                        <span className="font-medium tabular-nums">
                          {activePct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${activePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <PlanStat
                        icon={FileText}
                        value={p.testCases}
                        label="Cases"
                      />
                      <PlanStat value={p.draft} label="Draft" />
                      <PlanStat
                        icon={PlayCircle}
                        value={p.runs}
                        label="Runs"
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlanStat({
  icon: Icon,
  value,
  label,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-md bg-secondary/40 py-2">
      <p className="flex items-center justify-center gap-1 text-lg font-semibold tabular-nums">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

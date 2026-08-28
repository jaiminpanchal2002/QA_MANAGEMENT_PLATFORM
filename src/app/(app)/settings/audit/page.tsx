import type { Metadata } from "next";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";
import { listAuditLogsService } from "@/features/audit/service";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
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

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { data: logs, meta } = await listAuditLogsService({ page: sp.page });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="An immutable record of important actions in your organization."
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries yet"
          description="Actions like creating projects and test cases will appear here."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.entityType}
                  </TableCell>
                  <TableCell>{log.actorName ?? "System"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
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

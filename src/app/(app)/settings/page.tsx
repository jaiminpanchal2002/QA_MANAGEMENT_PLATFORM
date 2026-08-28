import type { Metadata } from "next";
import { format } from "date-fns";
import { listMembersService } from "@/features/members/service";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { can } from "@/lib/authorization/rbac";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { members, context } = await listMembersService();
  const canManage = can({ orgRole: context.orgRole }, "organization.manage_members");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your organization and members."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>
            You are signed in to{" "}
            <span className="font-medium text-foreground">
              {context.organizationName}
            </span>{" "}
            as <Badge variant="secondary">{context.orgRole}</Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members ({members.length})
          </CardTitle>
          <CardDescription>
            {canManage
              ? "You can invite and manage members (member management UI is part of the next slice)."
              : "You have read access to the member list."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={m.role === "OWNER" ? "default" : "secondary"}
                    >
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(m.joinedAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

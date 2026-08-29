import type { Metadata } from "next";
import { listMembersService } from "@/features/members/service";
import { MembersManager } from "@/features/members/members-manager";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { can } from "@/lib/authorization/rbac";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { members, context } = await listMembersService();
  const canManage = can(
    { orgRole: context.orgRole },
    "organization.manage_members"
  );

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

      <MembersManager
        members={members}
        currentUserId={context.user.id}
        actorRole={context.orgRole}
        canManage={canManage}
      />
    </div>
  );
}

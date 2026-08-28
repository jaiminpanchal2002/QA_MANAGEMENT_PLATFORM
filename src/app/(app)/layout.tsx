import { redirect } from "next/navigation";
import {
  getOrgContext,
  getSessionUser,
  getUserOrganizations,
} from "@/lib/auth/context";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { Topbar } from "@/components/shell/topbar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const ctx = await getOrgContext();
  if (!ctx) redirect("/onboarding");

  const organizations = await getUserOrganizations(user.id);

  return (
    <div className="flex min-h-screen">
      <AppSidebar orgRole={ctx.orgRole} />
      <div className="flex min-h-screen flex-1 flex-col md:pl-60">
        <Topbar
          user={user}
          activeOrgId={ctx.organizationId}
          organizations={organizations.map((o) => ({
            id: o.organizationId,
            name: o.name,
            role: o.role,
          }))}
        />
        <main className="flex-1 bg-muted/30 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

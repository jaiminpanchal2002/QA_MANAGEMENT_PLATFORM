import type { OrgRole } from "@/lib/authorization/permissions";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { Breadcrumbs } from "./breadcrumbs";

interface TopbarProps {
  user: { name: string; email: string };
  activeOrgId: string;
  orgRole: OrgRole;
  organizations: Array<{ id: string; name: string; role: string }>;
}

/** Application top bar: mobile nav + org switcher + breadcrumbs + user menu. */
export function Topbar({
  user,
  activeOrgId,
  orgRole,
  organizations,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav orgRole={orgRole} />
        <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
        <Breadcrumbs className="hidden lg:flex" />
      </div>
      <div className="flex items-center gap-2">
        <UserMenu user={user} />
      </div>
    </header>
  );
}

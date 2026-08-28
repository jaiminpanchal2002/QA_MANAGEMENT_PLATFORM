import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

interface TopbarProps {
  user: { name: string; email: string };
  activeOrgId: string;
  organizations: Array<{ id: string; name: string; role: string }>;
}

/** Application top bar: organization switcher + user menu. */
export function Topbar({ user, activeOrgId, organizations }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-8">
      <OrgSwitcher organizations={organizations} activeOrgId={activeOrgId} />
      <div className="flex items-center gap-2">
        <UserMenu user={user} />
      </div>
    </header>
  );
}

"use client";
import { usePathname } from "next/navigation";
import type { OrgRole } from "@/lib/authorization/permissions";
import { NavLink, primaryNav, secondaryNav } from "./nav";

export function AppSidebar({ orgRole }: { orgRole: OrgRole }) {
  const pathname = usePathname();
  const secondary = secondaryNav(orgRole);

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-5 font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
          Q
        </span>
        QA Platform
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Primary">
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="space-y-1 border-t p-3">
        {secondary.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
}

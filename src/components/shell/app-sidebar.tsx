"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  ListChecks,
  PlayCircle,
  Bug,
  BarChart3,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgRole } from "@/lib/authorization/permissions";
import { can } from "@/lib/authorization/rbac";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/test-cases", label: "Test Cases", icon: FileText },
  { href: "/test-plans", label: "Test Plans", icon: ListChecks },
  { href: "/test-runs", label: "Test Runs", icon: PlayCircle },
  { href: "/defects", label: "Defects", icon: Bug },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppSidebar({ orgRole }: { orgRole: OrgRole }) {
  const pathname = usePathname();
  const showAudit = can({ orgRole }, "audit.view");

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
        {showAudit && (
          <NavLink
            item={{ href: "/settings/audit", label: "Audit Log", icon: ScrollText }}
            pathname={pathname}
          />
        )}
        <NavLink
          item={{ href: "/settings", label: "Settings", icon: Settings }}
          pathname={pathname}
        />
      </div>
    </aside>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

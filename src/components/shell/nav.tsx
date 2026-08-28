"use client";
import Link from "next/link";
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

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/test-cases", label: "Test Cases", icon: FileText },
  { href: "/test-plans", label: "Test Plans", icon: ListChecks },
  { href: "/test-runs", label: "Test Runs", icon: PlayCircle },
  { href: "/defects", label: "Defects", icon: Bug },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

/** Secondary nav depends on org role (audit visibility). */
export function secondaryNav(orgRole: OrgRole): NavItem[] {
  const items: NavItem[] = [];
  if (can({ orgRole }, "audit.view")) {
    items.push({ href: "/settings/audit", label: "Audit Log", icon: ScrollText });
  }
  items.push({ href: "/settings", label: "Settings", icon: Settings });
  return items;
}

export function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
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

"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  "test-cases": "Test Cases",
  "test-plans": "Test Plans",
  "test-runs": "Test Runs",
  defects: "Defects",
  reports: "Reports",
  settings: "Settings",
  audit: "Audit Log",
};

function label(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  // UUID-like segments are shown as a short id.
  if (/^[0-9a-f-]{16,}$/i.test(segment)) return "Detail";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/** Pathname-derived breadcrumb trail. */
export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("items-center gap-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center gap-1">
        {segments.map((segment, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const isLast = i === segments.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              {isLast ? (
                <span className="font-medium text-foreground">
                  {label(segment)}
                </span>
              ) : (
                <Link href={href} className="hover:text-foreground">
                  {label(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

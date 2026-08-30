"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectReportRow } from "./service";

/** Analytics controls for the Reports page: drill-down filter + CSV export. */
export function ReportsToolbar({
  allProjects,
  selectedProjectId,
  rows,
}: {
  allProjects: Array<{ id: string; name: string; key: string }>;
  selectedProjectId: string | null;
  rows: ProjectReportRow[];
}) {
  const router = useRouter();

  function onSelect(value: string) {
    router.push(value === "all" ? "/reports" : `/reports?project=${value}`);
  }

  function exportCsv() {
    const header = [
      "Project",
      "Key",
      "Test cases",
      "Automated",
      "Automation %",
      "Passed",
      "Executed",
      "Pass rate %",
      "Open defects",
    ];
    const body = rows.map((r) => [
      r.name,
      r.key,
      r.testCases,
      r.automated,
      r.automationCoverage,
      r.passed,
      r.executed,
      r.passRate,
      r.openDefects,
    ]);
    const csv = [header, ...body]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={selectedProjectId ?? "all"} onValueChange={onSelect}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All projects</SelectItem>
          {allProjects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.key} — {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
        <Download className="h-4 w-4" /> Export CSV
      </Button>
    </div>
  );
}

/** RFC-4180 CSV escaping: quote cells containing comma, quote or newline. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

import type { Metadata } from "next";
import { ModuleLanding } from "@/components/shell/module-landing";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <ModuleLanding
      title="Reports"
      description="Server-aggregated QA reporting per project."
      note="Reporting metrics are computed server-side (see the dashboard for live organization-wide aggregation). Per-project execution, defect and release-readiness reports open from the project workspace."
    />
  );
}

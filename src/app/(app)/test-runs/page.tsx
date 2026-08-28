import type { Metadata } from "next";
import { ModuleLanding } from "@/components/shell/module-landing";

export const metadata: Metadata = { title: "Test Runs" };
export const dynamic = "force-dynamic";

export default function TestRunsPage() {
  return (
    <ModuleLanding
      title="Test Runs"
      description="Execute test plans and collect results per project."
      note="Test runs execute plans/cases and record executions with status, timing, logs and artifacts. Automation runs are queued via the AutomationProvider layer. Open a project to manage its runs."
    />
  );
}

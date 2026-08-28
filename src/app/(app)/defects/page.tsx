import type { Metadata } from "next";
import { ModuleLanding } from "@/components/shell/module-landing";

export const metadata: Metadata = { title: "Defects" };
export const dynamic = "force-dynamic";

export default function DefectsPage() {
  return (
    <ModuleLanding
      title="Defects"
      description="Track and triage defects per project."
      note="Defects are project-scoped with auto-generated references (e.g. SHOP-BUG-001) and can be linked to failed executions. Open a project to manage its defects."
    />
  );
}

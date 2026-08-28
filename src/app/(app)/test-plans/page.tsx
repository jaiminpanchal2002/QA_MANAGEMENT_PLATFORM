import type { Metadata } from "next";
import { ModuleLanding } from "@/components/shell/module-landing";

export const metadata: Metadata = { title: "Test Plans" };
export const dynamic = "force-dynamic";

export default function TestPlansPage() {
  return (
    <ModuleLanding
      title="Test Plans"
      description="Organize testing objectives and release cycles per project."
      note="Test plans group test cases for a release/objective. The schema, tenancy and permissions are implemented; the per-project planning UI is delivered inside the project workspace."
    />
  );
}

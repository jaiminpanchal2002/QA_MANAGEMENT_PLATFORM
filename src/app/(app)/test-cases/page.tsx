import type { Metadata } from "next";
import { ModuleLanding } from "@/components/shell/module-landing";

export const metadata: Metadata = { title: "Test Cases" };
export const dynamic = "force-dynamic";

export default function TestCasesPage() {
  return (
    <ModuleLanding
      title="Test Cases"
      description="Author and manage test cases within each project."
      note="Test cases are project-scoped. Open a project to view, author, filter, search and paginate its test cases."
    />
  );
}

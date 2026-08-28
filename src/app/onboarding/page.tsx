import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getOrgContext, requireUser } from "@/lib/auth/context";
import { OnboardingForm } from "@/features/organizations/onboarding-form";

export const metadata: Metadata = { title: "Create organization" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  await requireUser();
  // If the user already has an organization, skip onboarding.
  const ctx = await getOrgContext();
  if (ctx) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <OnboardingForm />
      </div>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/context";
import { VerifyEmailForm } from "@/features/auth/verify-email-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Verify your email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage() {
  // A verified user has a session (unverified users can't sign in), so send
  // them straight into the app.
  const user = await getSessionUser();
  if (user?.emailVerified) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}

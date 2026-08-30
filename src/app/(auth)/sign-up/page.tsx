import { Suspense } from "react";
import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
      <SignUpForm />
    </Suspense>
  );
}

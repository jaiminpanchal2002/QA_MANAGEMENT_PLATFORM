import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
      <SignInForm />
    </Suspense>
  );
}

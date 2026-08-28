"use client";
import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setLoading(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password/confirm",
    });
    setLoading(false);
    setSent(true);
    toast.success("If that email exists, a reset link is on its way.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send a reset link.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {sent ? (
            <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
              Check your inbox for a password reset link.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {!sent && (
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
          )}
          <Link href="/sign-in" className="text-sm text-muted-foreground">
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

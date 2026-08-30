"use client";
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COOLDOWN_SECONDS = 60;

export function VerifyEmailForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const invite = params.get("invite");
  const [cooldown, setCooldown] = React.useState(0);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function resend() {
    if (!email) {
      toast.error("Open this page from sign-up, or sign in to resend.");
      return;
    }
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: invite ? `/invitations/${invite}` : "/dashboard",
    });
    setSending(false);
    if (error) {
      // Don't leak whether the address exists — a generic success is safest.
      toast.error(error.message ?? "Could not send the email. Try again.");
      return;
    }
    toast.success("Verification email sent");
    setCooldown(COOLDOWN_SECONDS);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-5 w-5" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to{" "}
          {email ? (
            <strong className="text-foreground">{email}</strong>
          ) : (
            "your email address"
          )}
          . Click it to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or resend below. Your
          account stays inactive until it&apos;s verified.
        </p>
        <Button
          onClick={resend}
          disabled={sending || cooldown > 0}
          className="w-full"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend verification email"}
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          href="/sign-in"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { getSessionUser } from "@/lib/auth/context";
import {
  getInvitationForToken,
} from "@/features/members/invitations";
import { AcceptInvitation } from "@/features/members/accept-invitation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Invitation" };
export const dynamic = "force-dynamic";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invitation, user] = await Promise.all([
    getInvitationForToken(token),
    getSessionUser(),
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle>
              {invitation
                ? `Join ${invitation.organizationName}`
                : "Invitation not found"}
            </CardTitle>
            <CardDescription>{summary(invitation, user)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderBody(token, invitation, user)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type Invitation = Awaited<ReturnType<typeof getInvitationForToken>>;
type SessionUser = Awaited<ReturnType<typeof getSessionUser>>;

function summary(invitation: Invitation, user: SessionUser): string {
  if (!invitation) return "This invitation link is invalid or has been removed.";
  if (invitation.state === "accepted") return "This invitation was already accepted.";
  if (invitation.state === "revoked") return "This invitation has been revoked.";
  if (invitation.state === "expired") return "This invitation has expired.";
  if (user) return `You're signed in as ${user.email}.`;
  return `Invited as ${invitation.role.toLowerCase()}.`;
}

function renderBody(token: string, invitation: Invitation, user: SessionUser) {
  if (!invitation || invitation.state !== "pending") {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    );
  }

  const invitedEmail = invitation.email;

  // Signed in — either the right account (can accept) or the wrong one.
  if (user) {
    if (user.email.toLowerCase() === invitedEmail.toLowerCase()) {
      return (
        <>
          <InviteFacts email={invitedEmail} role={invitation.role} />
          <AcceptInvitation token={token} />
        </>
      );
    }
    return (
      <>
        <InviteFacts email={invitedEmail} role={invitation.role} />
        <p className="text-sm text-muted-foreground">
          This invitation is for{" "}
          <span className="font-medium text-foreground">{invitedEmail}</span>,
          but you&apos;re signed in as{" "}
          <span className="font-medium text-foreground">{user.email}</span>.
          Sign in with the invited email to accept.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/sign-in?redirect=/invitations/${token}`}>
            Switch account
          </Link>
        </Button>
      </>
    );
  }

  // Signed out — sign up (new) or sign in (existing), then return here.
  const q = `invite=${token}&email=${encodeURIComponent(invitedEmail)}`;
  return (
    <>
      <InviteFacts email={invitedEmail} role={invitation.role} />
      <Button asChild className="w-full">
        <Link href={`/sign-up?${q}`}>Create account &amp; join</Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href={`/sign-in?redirect=/invitations/${token}`}>
          I already have an account
        </Link>
      </Button>
    </>
  );
}

function InviteFacts({ email, role }: { email: string; role: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-2 text-sm">
      <span className="truncate text-muted-foreground">{email}</span>
      <Badge variant="secondary">{role}</Badge>
    </div>
  );
}

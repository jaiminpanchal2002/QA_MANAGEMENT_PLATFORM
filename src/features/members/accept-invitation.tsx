"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { acceptInvitationAction } from "./actions";
import { Button } from "@/components/ui/button";

export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function onAccept() {
    startTransition(async () => {
      const result = await acceptInvitationAction(token);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Invitation accepted");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Button className="w-full" onClick={onAccept} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Accept invitation
    </Button>
  );
}

"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { autoRunAction, cancelRunAction } from "./actions";
import { Button } from "@/components/ui/button";

export function RunActions({
  projectId,
  runId,
  isTerminal,
}: {
  projectId: string;
  runId: string;
  isTerminal: boolean;
}) {
  const router = useRouter();
  const [autoPending, startAuto] = React.useTransition();
  const [cancelPending, startCancel] = React.useTransition();

  function autoRun() {
    startAuto(async () => {
      const result = await autoRunAction(projectId, runId);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Auto-run complete — ${result.data.runStatus}`);
      router.refresh();
    });
  }

  function cancel() {
    startCancel(async () => {
      const result = await cancelRunAction(projectId, runId);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Run cancelled");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={autoRun}
        disabled={autoPending || cancelPending || isTerminal}
        title="Execute all cases via the simulated automation provider"
      >
        {autoPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
        Auto-run (simulated)
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={cancel}
        disabled={autoPending || cancelPending || isTerminal}
        className="text-destructive"
      >
        {cancelPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Cancel
      </Button>
    </div>
  );
}

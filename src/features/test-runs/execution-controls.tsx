"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Ban, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { executeAction } from "./actions";
import { cn } from "@/lib/utils";

type Status = "PASSED" | "FAILED" | "BLOCKED" | "SKIPPED";

const OPTIONS: {
  status: Status;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: string;
}[] = [
  { status: "PASSED", label: "Pass", icon: Check, active: "bg-success text-success-foreground border-success" },
  { status: "FAILED", label: "Fail", icon: X, active: "bg-destructive text-destructive-foreground border-destructive" },
  { status: "BLOCKED", label: "Block", icon: Ban, active: "bg-warning text-warning-foreground border-warning" },
  { status: "SKIPPED", label: "Skip", icon: SkipForward, active: "bg-secondary text-secondary-foreground border-border" },
];

export function ExecutionControls({
  projectId,
  runId,
  executionId,
  current,
  disabled,
}: {
  projectId: string;
  runId: string;
  executionId: string;
  current: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<Status | null>(null);
  const [value, setValue] = React.useState(current);

  async function set(status: Status) {
    if (disabled) return;
    setPending(status);
    const result = await executeAction(projectId, runId, executionId, {
      status,
    });
    setPending(null);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setValue(status);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.status;
        const isPending = pending === opt.status;
        return (
          <button
            key={opt.status}
            type="button"
            onClick={() => set(opt.status)}
            disabled={disabled || pending !== null}
            aria-label={opt.label}
            aria-pressed={isActive}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors disabled:opacity-50",
              isActive
                ? opt.active
                : "border-input bg-background text-muted-foreground hover:bg-secondary/60"
            )}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

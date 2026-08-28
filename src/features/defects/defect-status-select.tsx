"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateDefectStatusAction } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "REOPENED",
  "CLOSED",
] as const;

/**
 * Inline defect status changer. Even this small action shows a spinner while
 * the server action is in flight and is disabled to prevent double-submits.
 */
export function DefectStatusSelect({
  projectId,
  defectId,
  current,
}: {
  projectId: string;
  defectId: string;
  current: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(current);
  const [pending, startTransition] = React.useTransition();

  function onChange(next: string) {
    const previous = value;
    setValue(next); // optimistic
    startTransition(async () => {
      const result = await updateDefectStatusAction(projectId, defectId, next);
      if (!result.ok) {
        setValue(previous); // rollback
        toast.error(result.error.message);
        return;
      }
      toast.success(`Status → ${next.replace("_", " ")}`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="h-8 w-[150px]" aria-label="Defect status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

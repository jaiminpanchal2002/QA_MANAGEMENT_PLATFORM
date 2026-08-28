import { Badge } from "@/components/ui/badge";

type Variant =
  | "default"
  | "success"
  | "destructive"
  | "warning"
  | "secondary";

const VARIANT: Record<string, Variant> = {
  PASSED: "success",
  COMPLETED: "success",
  FAILED: "destructive",
  BLOCKED: "warning",
  RUNNING: "warning",
  QUEUED: "default",
  NOT_STARTED: "secondary",
  CANCELLED: "secondary",
};

/** Presentational badge mapping a run/execution status to a color. */
export function RunStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT[status] ?? "default"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

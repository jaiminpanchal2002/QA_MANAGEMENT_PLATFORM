import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "default" | "success" | "destructive" | "warning";
}

const accentClass = {
  default: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  destructive: "text-destructive bg-destructive/10",
  warning: "text-warning-foreground bg-warning/15",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        {Icon && (
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
              accentClass[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

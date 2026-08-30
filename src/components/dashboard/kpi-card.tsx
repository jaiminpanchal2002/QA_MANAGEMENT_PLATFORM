"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./animated-counter";

const accentClass = {
  default: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  destructive: "text-destructive bg-destructive/10",
  warning: "text-warning-foreground bg-warning/15",
};

/**
 * Dashboard KPI card: animated count-up, entrance rise (staggered by `index`),
 * hover elevation. Used for the command-center overview — visually punchier
 * than the static analytics cards on the Reports page.
 */
export function KpiCard({
  label,
  value,
  suffix,
  hint,
  icon,
  accent = "default",
  index = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  // A rendered element (not a component) — RSC can pass this across the
  // server→client boundary; a component function cannot.
  icon?: React.ReactNode;
  accent?: keyof typeof accentClass;
  index?: number;
}) {
  return (
    <Card
      className="animate-rise transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <CardContent className="flex items-center gap-4 p-5">
        {icon && (
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg [&_svg]:h-5 [&_svg]:w-5",
              accentClass[accent]
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

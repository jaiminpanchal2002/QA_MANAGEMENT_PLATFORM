"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

/** URL-driven pagination control with a pending indicator on navigation. */
export function Pagination({ page, totalPages, total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  function go(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {total} {total === 1 ? "result" : "results"} · page {page} of{" "}
        {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(page - 1)}
          disabled={page <= 1 || pending}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages || pending}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

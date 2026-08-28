"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * URL-driven search box. Debounced updates to the `search` query param so the
 * server component re-fetches with the new filter (server-side search). Shows
 * a spinner while the debounce is pending or the navigation is in flight.
 */
export function SearchInput({
  placeholder = "Search…",
  paramKey = "search",
}: {
  placeholder?: string;
  paramKey?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get(paramKey) ?? "");
  const [pending, startTransition] = React.useTransition();
  const [debouncing, setDebouncing] = React.useState(false);
  const initial = React.useRef(true);

  React.useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    setDebouncing(true);
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(paramKey, value);
      else params.delete(paramKey);
      params.delete("page");
      setDebouncing(false);
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const busy = pending || debouncing;

  return (
    <div className="relative w-full sm:max-w-xs">
      {busy ? (
        <Loader2 className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}

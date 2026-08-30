"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * URL-driven filter dropdown. Writes the chosen value to a query param
 * (resetting pagination) so filtering is server-rendered, shareable and works
 * with the Back button. "all" clears the param.
 */
export function FilterSelect({
  param,
  value,
  placeholder,
  options,
  className,
}: {
  param: string;
  value?: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete(param);
    else params.set(param, next);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={value ?? "all"} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-40"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { OrgRole } from "@/lib/authorization/permissions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLink, primaryNav, secondaryNav } from "./nav";

/** Hamburger + slide-in navigation for < md screens. */
export function MobileNav({ orgRole }: { orgRole: OrgRole }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const secondary = secondaryNav(orgRole);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-16 items-center gap-2 border-b px-5 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            Q
          </span>
          <SheetTitle className="text-base">QA Platform</SheetTitle>
        </div>
        <nav className="space-y-1 p-3" aria-label="Primary">
          {primaryNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={close}
            />
          ))}
        </nav>
        <div className="space-y-1 border-t p-3">
          {secondary.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={close}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

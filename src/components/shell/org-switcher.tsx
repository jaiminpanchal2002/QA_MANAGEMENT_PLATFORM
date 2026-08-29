"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { switchOrganizationAction } from "@/features/organizations/actions";
import { CreateOrgDialog } from "@/features/organizations/create-org-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Org {
  id: string;
  name: string;
  role: string;
}

export function OrgSwitcher({
  organizations,
  activeOrgId,
}: {
  organizations: Org[];
  activeOrgId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const active = organizations.find((o) => o.id === activeOrgId);

  function switchTo(id: string) {
    if (id === activeOrgId) return;
    startTransition(async () => {
      const result = await switchOrganizationAction(id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="max-w-[220px] justify-between gap-2"
            disabled={pending}
          >
            <span className="truncate">{active?.name ?? "Select org"}</span>
            {pending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-70" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => switchTo(org.id)}
              className="justify-between"
            >
              <span className="truncate">{org.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {org.role}
                </span>
                <Check
                  className={cn(
                    "h-4 w-4",
                    org.id === activeOrgId ? "opacity-100" : "opacity-0"
                  )}
                />
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              // Close the menu first, then open the dialog on the next tick so
              // the two overlays don't stack or fight over focus.
              e.preventDefault();
              setMenuOpen(false);
              setTimeout(() => setCreateOpen(true), 0);
            }}
          >
            <Plus className="h-4 w-4" />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

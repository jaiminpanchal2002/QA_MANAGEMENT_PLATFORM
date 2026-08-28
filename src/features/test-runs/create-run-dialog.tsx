"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createRunAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CaseOption {
  id: string;
  reference: string;
  title: string;
}

export function CreateRunDialog({
  projectId,
  cases,
}: {
  projectId: string;
  cases: CaseOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [name, setName] = React.useState("");
  const [environment, setEnvironment] = React.useState("staging");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === cases.length ? new Set() : new Set(cases.map((c) => c.id))
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      toast.error("Select at least one test case");
      return;
    }
    setSubmitting(true);
    const result = await createRunAction(projectId, {
      name: name.trim() || "Test Run",
      environment: environment.trim() || null,
      testCaseIds: [...selected],
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Run created");
    setOpen(false);
    router.push(`/projects/${projectId}/runs/${result.data.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={cases.length === 0}>
          <Plus className="h-4 w-4" /> New run
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New test run</DialogTitle>
          <DialogDescription>
            Pick the test cases to include; each becomes an execution to record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="run-name">Name</Label>
              <Input
                id="run-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Regression Run #43"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="run-env">Environment</Label>
              <Input
                id="run-env"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="staging"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Test cases ({selected.size} selected)</Label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                {selected.size === cases.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
              {cases.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-secondary/60"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <Badge variant="secondary" className="font-mono text-xs">
                    {c.reference}
                  </Badge>
                  <span className="truncate">{c.title}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create run
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

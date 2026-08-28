"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createTestCaseSchema, type CreateTestCaseInput } from "./schema";
import { createTestCaseAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const TYPES = [
  "FUNCTIONAL",
  "REGRESSION",
  "SMOKE",
  "INTEGRATION",
  "E2E",
  "API",
  "SECURITY",
] as const;

export function CreateTestCaseDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const form = useForm<CreateTestCaseInput>({
    resolver: zodResolver(createTestCaseSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      severity: "MINOR",
      type: "FUNCTIONAL",
      status: "DRAFT",
      automationStatus: "MANUAL",
      tags: [],
      steps: [{ action: "", expectedResult: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  async function onSubmit(values: CreateTestCaseInput) {
    const result = await createTestCaseAction(projectId, values);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Created ${result.data.reference}`);
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New test case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New test case</DialogTitle>
          <DialogDescription>
            A reference (e.g. {`<KEY>`}-TC-001) is assigned automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="User can log in with valid credentials" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional context"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>Steps</Label>
              {fields.map((f, index) => (
                <div key={f.id} className="flex gap-2">
                  <span className="mt-2 w-5 text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <Input
                    placeholder="Action"
                    {...form.register(`steps.${index}.action`)}
                  />
                  <Input
                    placeholder="Expected result"
                    {...form.register(`steps.${index}.expectedResult`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Remove step"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ action: "", expectedResult: "" })}
              >
                <Plus className="h-4 w-4" /> Add step
              </Button>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create test case
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

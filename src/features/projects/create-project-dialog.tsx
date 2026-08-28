"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createProjectSchema, type CreateProjectInput } from "./schema";
import { createProjectAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", key: "", description: "" },
  });

  async function onSubmit(values: CreateProjectInput) {
    const result = await createProjectAction(values);
    if (!result.ok) {
      if (result.error.fields) {
        for (const [field, messages] of Object.entries(result.error.fields)) {
          form.setError(field as keyof CreateProjectInput, {
            message: messages[0],
          });
        }
      } else {
        toast.error(result.error.message);
      }
      return;
    }
    toast.success(`Project ${result.data.key} created`);
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Projects group your test assets. The key builds references like
            SHOP-TC-001.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Shop Checkout" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SHOP"
                      className="uppercase"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    2–10 letters/numbers, unique in your organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional summary"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full sm:w-auto"
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

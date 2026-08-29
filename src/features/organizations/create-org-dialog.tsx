"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "./schema";
import { createOrganizationAction } from "./actions";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Create an additional organization from anywhere in the app (the org
 * switcher). Unlike the /onboarding page — which is only for first-time users
 * with no tenant yet — this works for users who already belong to one or more
 * organizations, satisfying the "multiple organizations per user" requirement.
 *
 * Controlled: the parent owns `open` so it can be launched from a dropdown item.
 * On success the server action makes the new org the active tenant (cookie).
 */
export function CreateOrgDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: CreateOrganizationInput) {
    const result = await createOrganizationAction({
      name: values.name,
      description: values.description ?? null,
    });
    if (!result.ok) {
      if (result.error.fields) {
        for (const [field, messages] of Object.entries(result.error.fields)) {
          form.setError(field as keyof CreateOrganizationInput, {
            message: messages[0],
          });
        }
      } else {
        toast.error(result.error.message);
      }
      return;
    }
    toast.success("Organization created");
    onOpenChange(false);
    form.reset();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            A new organization is a fully isolated tenant — its own projects,
            members and data. You become its OWNER.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme QA" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does your team test?"
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
                Create organization
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

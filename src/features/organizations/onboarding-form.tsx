"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createOrganizationAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const result = await createOrganizationAction({
      name: String(form.get("name")).trim(),
      description: String(form.get("description") ?? "").trim() || null,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast.success("Organization created");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your organization</CardTitle>
        <CardDescription>
          Your organization is your tenant — projects, teams and data live
          inside it.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" name="name" required placeholder="Acme QA" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What does your team test?"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create organization
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { passwordRules, signUpSchema, type SignUpInput } from "./schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite");
  const prefillEmail = params.get("email") ?? "";
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: { name: "", email: prefillEmail, password: "" },
  });
  const password = form.watch("password");

  async function onSubmit(values: SignUpInput) {
    setError(null);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      // Where the verification link lands after the email is confirmed.
      callbackURL: invite ? `/invitations/${invite}` : "/dashboard",
    });
    if (error) {
      setError(error.message ?? "Could not create account");
      return;
    }
    // Email verification is required — the account exists but is inactive
    // until verified. Send them to the "check your email" screen.
    toast.success(
      "Account created — check your email (and spam folder) to verify"
    );
    const q = new URLSearchParams({ email: values.email });
    if (invite) q.set("invite", invite);
    router.push(`/verify-email?${q.toString()}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start managing your team&apos;s quality assurance.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ada Lovelace" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      readOnly={Boolean(prefillEmail)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <ul className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {passwordRules.map((rule) => {
                      const met = rule.test(password);
                      return (
                        <li
                          key={rule.label}
                          className={cn(
                            "flex items-center gap-1.5 text-xs",
                            met ? "text-success" : "text-muted-foreground"
                          )}
                        >
                          {met ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-primary">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

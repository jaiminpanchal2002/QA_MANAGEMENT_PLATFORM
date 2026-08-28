import Link from "next/link";
import { CheckCircle2, ShieldCheck, Workflow, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Workflow,
    title: "Full QA lifecycle",
    body: "Requirements, test cases, plans, runs, executions, defects and reporting in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-tenant & secure",
    body: "Strict organization isolation, server-enforced RBAC, and an immutable audit trail.",
  },
  {
    icon: BarChart3,
    title: "Real-time insight",
    body: "Pass rates, execution trends and defect analytics computed from live data.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              Q
            </span>
            QA Platform
          </div>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center py-24 text-center">
          <span className="mb-4 inline-flex items-center gap-1 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" /> Built for QA teams
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Quality assurance management for modern engineering teams
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
            Plan, execute and track testing across projects and releases. Manage
            defects, wire up automation, and know exactly when you&apos;re ready
            to ship.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Create your workspace</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="container grid gap-6 pb-24 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-6">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          QA Management Platform — a modular-monolith reference implementation.
        </div>
      </footer>
    </div>
  );
}

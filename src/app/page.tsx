import type { ComponentType } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Workflow,
  BarChart3,
  Users,
  PlayCircle,
  Bug,
  ArrowRight,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { TiltCard } from "@/components/marketing/tilt-card";

const features = [
  {
    icon: Workflow,
    title: "Full QA lifecycle",
    body: "Requirements, test cases, plans, runs, executions, defects and reporting — one connected workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-tenant & secure",
    body: "Strict organization isolation, server-enforced RBAC, and an immutable audit trail on every action.",
  },
  {
    icon: BarChart3,
    title: "Real-time insight",
    body: "Pass rates, execution trends and defect analytics computed live from your data — never mocked.",
  },
  {
    icon: Users,
    title: "Built for teams",
    body: "Invite members by email, assign granular roles, and collaborate across projects and releases.",
  },
  {
    icon: PlayCircle,
    title: "Manual & automated",
    body: "Run tests by hand or ingest CI results through a provider-agnostic automation adapter.",
  },
  {
    icon: Bug,
    title: "Defect tracking",
    body: "Log, triage and resolve defects with severity, status and references linked to test runs.",
  },
];

const steps = [
  {
    icon: Building2,
    title: "Create your organization",
    body: "Spin up an isolated tenant in seconds. Your projects, members and data live only inside it.",
  },
  {
    icon: Users,
    title: "Invite your team",
    body: "Add teammates by email and assign roles — from owner to viewer — with the right access.",
  },
  {
    icon: CheckCircle2,
    title: "Ship with confidence",
    body: "Author tests, run them, track defects, and watch live quality metrics tell you when you're ready.",
  },
];

const stats = [
  { value: "4", label: "Org roles" },
  { value: "5", label: "Project roles" },
  { value: "100%", label: "Tenant isolation" },
  { value: "1", label: "Unified workspace" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
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
        {/* Hero -------------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          {/* Animated aurora background */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="animate-aurora absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />
            <div
              className="animate-aurora absolute -right-16 top-10 h-[24rem] w-[24rem] rounded-full bg-sky-400/20 blur-3xl"
              style={{ animationDelay: "-6s" }}
            />
            <div
              className="animate-aurora absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-fuchsia-400/15 blur-3xl"
              style={{ animationDelay: "-12s" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          </div>

          <div className="container flex flex-col items-center py-24 text-center sm:py-32">
            <span
              className="animate-rise mb-5 inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Multi-tenant QA management, built for scale
            </span>

            <h1
              className="animate-rise max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Quality assurance for{" "}
              <span className="text-sheen">modern engineering teams</span>
            </h1>

            <p
              className="animate-rise mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
              style={{ animationDelay: "160ms" }}
            >
              Plan, execute and track testing across projects and releases.
              Manage defects, wire up automation, and know exactly when
              you&apos;re ready to ship — all in one collaborative workspace.
            </p>

            <div
              className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "240ms" }}
            >
              <Button asChild size="lg" className="group">
                <Link href="/sign-up">
                  Create your workspace
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>

            {/* Floating product mockup with pointer-tracked 3D tilt */}
            <div
              className="animate-rise mt-16 w-full max-w-4xl [perspective:1600px]"
              style={{ animationDelay: "320ms" }}
            >
              <TiltCard className="relative">
                <div className="animate-float rounded-xl border bg-card/80 p-3 shadow-2xl shadow-primary/10 backdrop-blur [transform-style:preserve-3d]">
                  <DashboardMockup />

                  {/* Parallax accent chips — lifted toward the viewer on Z */}
                  <div className="pointer-events-none absolute -left-5 top-8 hidden [transform:translateZ(70px)] sm:block">
                    <FloatingChip
                      icon={CheckCircle2}
                      label="Run passed"
                      tone="success"
                    />
                  </div>
                  <div className="pointer-events-none absolute -right-5 bottom-14 hidden [transform:translateZ(95px)] sm:block">
                    <FloatingChip
                      icon={Bug}
                      label="Defect logged"
                      tone="destructive"
                    />
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* Stats ------------------------------------------------------------ */}
        <section className="border-y bg-muted/30">
          <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal
                key={s.label}
                delay={i * 80}
                className="text-center"
              >
                <div className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {s.label}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features --------------------------------------------------------- */}
        <section className="container py-24">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything QA, nothing extra
            </h2>
            <p className="mt-3 text-muted-foreground">
              A focused toolkit for the entire testing lifecycle — designed to
              feel fast and stay out of your way.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90} className="h-full">
                <TiltCard maxTilt={5} className="group h-full">
                  <div className="relative h-full overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-110">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.body}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works ----------------------------------------------------- */}
        <section className="border-t bg-muted/30">
          <div className="container py-24">
            <Reveal className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From zero to shipping in three steps
              </h2>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 120} className="relative">
                  <div className="flex flex-col items-start">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
                      Step {i + 1}
                    </span>
                    <h3 className="mb-1.5 font-semibold">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA -------------------------------------------------------------- */}
        <section className="container py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
              >
                <div className="animate-aurora absolute left-1/4 top-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div
                  className="animate-aurora absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl"
                  style={{ animationDelay: "-8s" }}
                />
              </div>
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Bring your QA into one place
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Create an organization, invite your team, and start tracking
                quality today. No credit card required.
              </p>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="group">
                  <Link href="/sign-up">
                    Get started free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              Q
            </span>
            QA Management Platform
          </div>
          <span>A scalable, multi-tenant reference implementation.</span>
        </div>
      </footer>
    </div>
  );
}

/** Lightweight, purely decorative dashboard preview for the hero. */
function DashboardMockup() {
  const tiles = [
    { label: "Test cases", value: "128", accent: "text-foreground" },
    { label: "Pass rate", value: "94%", accent: "text-success" },
    { label: "Open defects", value: "3", accent: "text-destructive" },
    { label: "Automation", value: "61%", accent: "text-primary" },
  ];
  const bars = [45, 68, 52, 80, 63, 90, 74];
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 text-xs text-muted-foreground">Dashboard</span>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border bg-card p-3 text-left">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t.label}
            </div>
            <div className={`mt-1 text-xl font-bold ${t.accent}`}>
              {t.value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex h-32 items-end gap-2 px-4 pb-4">
        {bars.map((h, i) => (
          <div
            key={i}
            className="animate-grow-bar flex-1 origin-bottom rounded-t bg-gradient-to-t from-primary/40 to-primary"
            style={{ height: `${h}%`, animationDelay: `${500 + i * 70}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function FloatingChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: "success" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : "text-destructive";
  return (
    <div className="animate-float flex items-center gap-2 rounded-lg border bg-card/95 px-3 py-2 text-xs font-medium shadow-xl backdrop-blur">
      <span className={`inline-flex ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </div>
  );
}

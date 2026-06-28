import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { Briefcase, Users, BarChart3, FileSearch, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khatiana Job Portal — Recruit smarter" },
      { name: "description", content: "Post jobs, screen applicants with AI match scoring, and manage your hiring pipeline end-to-end." },
      { property: "og:title", content: "Khatiana Job Portal — Recruit smarter" },
      { property: "og:description", content: "Post jobs, screen applicants with AI match scoring, and manage your hiring pipeline end-to-end." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-primary-soft/40 to-card p-8 sm:p-12 lg:p-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Recruitment, reimagined
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Hire the right people, <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">faster</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Khatiana brings every step of recruitment into one place — post vacancies,
              receive applications, score candidates automatically, and move them through
              your pipeline.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/jobs">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  View open roles <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">Get started</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { value: "10x", label: "Faster shortlisting" },
            { value: "60%", label: "Less manual screening" },
            { value: "24/7", label: "Always-on applicant intake" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Features */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Everything you need to hire</h2>
            <p className="mt-1 text-sm text-muted-foreground">One workspace for posting, screening, and tracking.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Briefcase, title: "Job post management", desc: "Create, edit, and schedule vacancies with deadlines and department filtering." },
              { icon: Users, title: "Applicant tracking", desc: "Move candidates through New → Shortlisted → Interview → Selected → Confirmed." },
              { icon: FileSearch, title: "Quality match score", desc: "Auto-rank candidates by skills, education, and experience fit." },
              { icon: BarChart3, title: "Live dashboards", desc: "See applications, interviews, and hires per role in real time." },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-border bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold sm:text-3xl">Ready to hire your next teammate?</h3>
              <p className="mt-2 text-primary-foreground/80">Browse open roles or post a vacancy in minutes.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/jobs">
                <Button size="lg" variant="secondary" className="gap-2">
                  Browse jobs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Khatiana. All rights reserved.
        </footer>
      </div>
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/khatiana-logo.png.asset.json";
import { Briefcase, Users, BarChart3, FileSearch } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="Khatiana" className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/jobs">
              <Button variant="ghost">Browse jobs</Button>
            </Link>
            <Link to="/auth">
              <Button>Sign in</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--color-primary-soft),_transparent_60%)]" />
          <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                Recruitment, reimagined
              </span>
              <h1 className="mt-5 text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
                Hire the right people, <span className="text-primary">faster</span>.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Khatiana brings every step of recruitment into one place — post vacancies,
                receive applications, score candidates automatically, and move them through
                your pipeline.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg">Get started</Button>
                </Link>
                <Link to="/jobs">
                  <Button size="lg" variant="outline">View open roles</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Briefcase, title: "Job post management", desc: "Create, edit, and schedule vacancies with deadlines and department filtering." },
              { icon: Users, title: "Applicant tracking", desc: "Move candidates through New → Shortlisted → Interview → Selected → Confirmed." },
              { icon: FileSearch, title: "Quality match score", desc: "Auto-rank candidates by skills, education, and experience fit." },
              { icon: BarChart3, title: "Live dashboards", desc: "See applications, interviews, and hires per role in real time." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Khatiana. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

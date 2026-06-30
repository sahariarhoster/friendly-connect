import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  Sparkles,
  Leaf,
  ShieldCheck,
  HeartHandshake,
  Truck,
  Users,
  Briefcase,
  FileSearch,
  ClipboardList,
  Lock,
  CheckCircle2,
} from "lucide-react";
const logo = { url: "/khatiana-logo.png" };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khatiana Careers — Internal Recruitment Portal" },
      {
        name: "description",
        content:
          "The official internal recruitment portal of Khatiana — Bangladesh's homegrown brand for pure honey, homemade pickles, ghee, spices and natural foods. Built exclusively for the Khatiana team.",
      },
      { property: "og:title", content: "Khatiana Careers — Internal Recruitment Portal" },
      {
        property: "og:description",
        content:
          "Join the Khatiana family. Browse open roles across our pickle, honey, spice and operations teams.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const VALUES = [
  {
    icon: Leaf,
    title: "100% Natural",
    desc: "Pure honey, homemade pickles, cold-pressed ghee and hand-ground spices — no preservatives, no shortcuts.",
  },
  {
    icon: HeartHandshake,
    title: "Made by Real People",
    desc: "Sourced directly from rural Bangladeshi farmers, beekeepers and home kitchens we've known for years.",
  },
  {
    icon: ShieldCheck,
    title: "Quality First",
    desc: "Every batch is tasted, weighed and packed by hand before it reaches a Khatiana customer.",
  },
  {
    icon: Truck,
    title: "Trusted Across Bangladesh",
    desc: "Thousands of repeat orders delivered nationwide — honey, ghee, mango, mishti and more.",
  },
];

const STEPS = [
  { icon: FileSearch, title: "Browse open roles", desc: "See every vacancy across our departments and offices." },
  { icon: ClipboardList, title: "Apply in minutes", desc: "Fill the role-specific form — no account needed to apply." },
  { icon: Users, title: "Talk to the team", desc: "Shortlisted candidates are contacted directly by our HR team." },
];

function Landing() {
  return (
    <>
      <div className="space-y-10 p-4 sm:p-6 lg:p-8">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-primary-soft/40 to-card p-8 sm:p-12 lg:p-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr,1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Khatiana Careers
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Build a career rooted in{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  pure, natural food.
                </span>
              </h1>
              <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Khatiana is Bangladesh's homegrown brand for pure honey, homemade pickles, ghee,
                spices, jaggery and seasonal mangoes. This portal is where our team posts vacancies
                and where you apply to join the family.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/jobs">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    See open positions <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="https://khatiana.com" target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline">Visit khatiana.com</Button>
                </a>
              </div>
            </div>
            <div className="relative hidden justify-self-end lg:block">
              <div className="rounded-3xl border border-primary/20 bg-card/70 p-8 shadow-xl backdrop-blur">
                <img src={logo.url} alt="Khatiana" className="mx-auto h-32 w-auto" />
                <div className="mt-6 text-center">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Since day one</div>
                  <div className="mt-1 text-lg font-semibold">Pure. Natural. Khatiana.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="grid gap-8 rounded-3xl border border-border bg-card p-8 sm:p-10 lg:grid-cols-[1fr,1.2fr] lg:gap-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">About Khatiana</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Real food. Real farmers. Real care.</h2>
            <p className="mt-4 text-muted-foreground">
              We started Khatiana with one simple promise — bring the taste of village kitchens and
              flower-field honey straight to urban homes, without ever cutting corners on purity.
              Today we serve thousands of families across Bangladesh with products they can actually trust.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Homemade pickles (আচার) made the way grandmothers did",
                "Single-origin honey (মধু) — mustard, black cumin, mixed flower",
                "Pure cow ghee, hand-ground spices and natural jaggery",
                "Seasonal Gobindobhog & Himsagar mangoes, fresh from the orchard",
              ].map((line) => (
                <li key={line} className="flex gap-2 text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="group rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why work with us */}
        <section>
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Why join us</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">More than a job — a family</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Khatiana is small, ambitious and fiercely proud of what it makes. Every teammate shapes
              the brand directly — there are no nameless cogs here.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Briefcase, title: "Real ownership", desc: "Own your work end-to-end. Ship things customers actually use within weeks, not quarters." },
              { icon: Users, title: "Tight-knit team", desc: "Work shoulder-to-shoulder with founders, makers and farmers. Decisions happen fast." },
              { icon: Leaf, title: "Purposeful product", desc: "Help bring honest, healthy food to thousands of Bangladeshi homes every single day." },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to apply */}
        <section className="rounded-3xl border border-border bg-gradient-to-br from-card to-primary-soft/30 p-8 sm:p-10">
          <div className="mb-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Apply in three simple steps</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-border bg-background p-6">
                <div className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                  Step {i + 1}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-border bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold sm:text-3xl">Ready to join the Khatiana family?</h3>
              <p className="mt-2 text-primary-foreground/85">
                Browse current openings across operations, production, marketing and delivery teams.
              </p>
            </div>
            <Link to="/jobs">
              <Button size="lg" variant="secondary" className="gap-2">
                Browse open roles <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Khatiana — Internal recruitment portal. Visit our store at{" "}
          <a href="https://khatiana.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            khatiana.com
          </a>
        </footer>
      </div>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/khatiana-logo.png.asset.json";

export const Route = createFileRoute("/jobs")({
  head: () => ({
    meta: [
      { title: "Open roles — Khatiana Job Portal" },
      { name: "description", content: "Browse open positions at Khatiana across all departments." },
      { property: "og:title", content: "Open roles — Khatiana Job Portal" },
      { property: "og:description", content: "Browse open positions at Khatiana across all departments." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="Khatiana" className="h-9 w-auto" />
          </Link>
          <Link to="/auth">
            <Button>Sign in</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Open roles</h1>
        <p className="mt-3 text-muted-foreground">
          Job listings will appear here in Phase 2 — once admins publish their first vacancies.
        </p>
      </main>
    </div>
  );
}

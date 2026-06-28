import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/useRoles";
import { Briefcase, Users, FileText, Inbox, ArrowRight, Sparkles, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    staleTime: 5 * 60_000,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });

  const { data: roles, isLoading: rolesLoading } = useRoles(user.id);
  const isAdmin = roles?.includes("admin");

  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
    staleTime: 30_000,
    queryFn: async () => {
      const [jobs, openJobs, apps, pending] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("job_applications").select("*", { count: "exact", head: true }),
        supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        jobs: jobs.count ?? 0,
        openJobs: openJobs.count ?? 0,
        apps: apps.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  const { data: myAppCount, isLoading: myCountLoading } = useQuery({
    queryKey: ["my-app-count", user.id],
    enabled: !isAdmin && !!roles,
    staleTime: 30_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", user.id);
      return count ?? 0;
    },
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "there";

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-primary-soft/40 to-background p-6 sm:p-8">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3 w-3 text-primary" />
                {isAdmin ? "Admin workspace" : "Applicant workspace"}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Welcome back, {firstName} 👋
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                {isAdmin
                  ? "Manage your job posts, screen incoming applicants, and move them through the hiring pipeline."
                  : "Discover open roles tailored to you and keep tabs on every application in one place."}
              </p>
            </div>
            {!rolesLoading && (
              <Badge variant="secondary" className="shrink-0">
                {isAdmin ? "Admin" : "Applicant"}
              </Badge>
            )}
          </div>
        </section>

        {isAdmin ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsLoading
                ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                : (
                  <>
                    <Stat icon={Briefcase} label="Total jobs" value={adminStats?.jobs ?? 0} />
                    <Stat icon={Sparkles} label="Open jobs" value={adminStats?.openJobs ?? 0} accent />
                    <Stat icon={Inbox} label="Applications" value={adminStats?.apps ?? 0} />
                    <Stat icon={FileText} label="Pending review" value={adminStats?.pending ?? 0} accent />
                  </>
                )}
            </div>
            <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <ActionTile to="/admin/jobs" icon={Briefcase} title="Manage jobs" desc="Create, edit, publish, or close vacancies." />
              <ActionTile to="/admin/applications" icon={Users} title="Review applicants" desc="Move candidates through the pipeline." />
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {myCountLoading
                ? <><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
                : (
                  <>
                    <Stat icon={FileText} label="My applications" value={myAppCount ?? 0} accent />
                    <Stat icon={Briefcase} label="Open roles" value={adminStats?.openJobs ?? "—"} />
                    <Stat icon={UserIcon} label="Profile" value={profile?.full_name ? "Complete" : "Setup"} />
                  </>
                )}
            </div>
            <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <ActionTile to="/jobs" icon={Briefcase} title="Browse open roles" desc="Find a position that matches you." />
              <ActionTile to="/applications" icon={FileText} title="My applications" desc="Track the status of every application." />
            </div>
          </>
      </main>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; accent?: boolean }) {
  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary-soft text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-2xl font-bold tracking-tight text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActionTile({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base truncate">{title}</CardTitle>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">{desc}</CardContent>
      </Card>
    </Link>
  );
}

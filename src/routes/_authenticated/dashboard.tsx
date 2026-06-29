import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoles } from "@/hooks/useRoles";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/positions";
import {
  Briefcase,
  Users,
  FileText,
  Inbox,
  ArrowRight,
  Sparkles,
  User as UserIcon,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type RecentApp = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  jobs: { title: string } | null;
};

type RecentJob = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  status: string;
  created_at: string;
};

function Dashboard() {
  const { user } = Route.useRouteContext();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    staleTime: 5 * 60_000,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });

  const { data: roles, isLoading: rolesLoading } = useRoles(user.id);
  const isAdmin = roles?.includes("admin");

  /* ---------------- ADMIN DATA ---------------- */
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
    staleTime: 30_000,
    queryFn: async () => {
      const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const [jobs, openJobs, apps, pending, newThisWeek, hired, rejected] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("job_applications").select("*", { count: "exact", head: true }),
        supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("job_applications").select("*", { count: "exact", head: true }).gte("created_at", since7),
        supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("status", "hired"),
        supabase.from("job_applications").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      return {
        jobs: jobs.count ?? 0,
        openJobs: openJobs.count ?? 0,
        apps: apps.count ?? 0,
        pending: pending.count ?? 0,
        newThisWeek: newThisWeek.count ?? 0,
        hired: hired.count ?? 0,
        rejected: rejected.count ?? 0,
      };
    },
  });

  const { data: pipeline } = useQuery({
    queryKey: ["admin-pipeline"],
    enabled: !!isAdmin,
    staleTime: 30_000,
    queryFn: async () => {
      const entries = await Promise.all(
        APPLICATION_STATUSES.map(async (s) => {
          const { count } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("status", s);
          return [s, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const { data: recentApps } = useQuery({
    queryKey: ["admin-recent-apps"],
    enabled: !!isAdmin,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("id, full_name, email, status, created_at, jobs(title)")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as unknown as RecentApp[];
    },
  });

  const { data: topJobs } = useQuery({
    queryKey: ["admin-top-jobs"],
    enabled: !!isAdmin,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, department, status")
        .eq("status", "open")
        .limit(20);
      if (!jobs) return [];
      const counts = await Promise.all(
        jobs.map(async (j) => {
          const { count } = await supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", j.id);
          return { ...j, applicants: count ?? 0 };
        }),
      );
      return counts.sort((a, b) => b.applicants - a.applicants).slice(0, 5);
    },
  });

  /* ---------------- APPLICANT DATA ---------------- */
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

  const { data: myStatusBreakdown } = useQuery({
    queryKey: ["my-status-breakdown", user.id],
    enabled: !isAdmin && !!roles,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("status")
        .eq("applicant_id", user.id);
      const out: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        out[r.status] = (out[r.status] ?? 0) + 1;
      });
      return out;
    },
  });

  const { data: myRecentApps } = useQuery({
    queryKey: ["my-recent-apps", user.id],
    enabled: !isAdmin && !!roles,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("id, full_name, email, status, created_at, jobs(title)")
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as unknown as RecentApp[];
    },
  });

  const { data: latestJobs } = useQuery({
    queryKey: ["latest-open-jobs"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, department, location, status, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as RecentJob[];
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
                ? "Here's a live look at hiring activity across your organization."
                : "Track your applications and discover roles that match your strengths."}
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
        <AdminView
          stats={adminStats}
          statsLoading={statsLoading}
          pipeline={pipeline}
          recentApps={recentApps}
          topJobs={topJobs}
        />
      ) : (
        <ApplicantView
          myAppCount={myAppCount}
          myCountLoading={myCountLoading}
          openJobs={latestJobs?.length ?? 0}
          profileComplete={!!profile?.full_name}
          breakdown={myStatusBreakdown}
          recentApps={myRecentApps}
          latestJobs={latestJobs}
        />
      )}
    </main>
  );
}

/* ============================ ADMIN VIEW ============================ */
function AdminView({
  stats,
  statsLoading,
  pipeline,
  recentApps,
  topJobs,
}: {
  stats: { jobs: number; openJobs: number; apps: number; pending: number; newThisWeek: number; hired: number; rejected: number } | undefined;
  statsLoading: boolean;
  pipeline: Record<string, number> | undefined;
  recentApps: RecentApp[] | undefined;
  topJobs: Array<{ id: string; title: string; department: string | null; applicants: number }> | undefined;
}) {
  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : (
            <>
              <Stat icon={Briefcase} label="Open jobs" value={stats?.openJobs ?? 0} sub={`${stats?.jobs ?? 0} total`} accent />
              <Stat icon={Inbox} label="Applications" value={stats?.apps ?? 0} sub={`${stats?.newThisWeek ?? 0} this week`} />
              <Stat icon={Clock} label="Pending review" value={stats?.pending ?? 0} sub="Awaiting screening" accent />
              <Stat icon={CheckCircle2} label="Hired" value={stats?.hired ?? 0} sub={`${stats?.rejected ?? 0} rejected`} />
            </>
          )}
      </div>

      {/* Pipeline */}
      <section className="mt-10">
        <SectionTitle icon={TrendingUp} title="Application pipeline" subtitle="Where every candidate stands right now" />
        <Card>
          <CardContent className="py-6">
            <PipelineBar pipeline={pipeline} />
          </CardContent>
        </Card>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        {/* Recent applications */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={Users} title="Recent applications" subtitle="Latest 5 submissions" compact />
              <Link to="/admin/applications" className="text-xs font-medium text-primary hover:underline">
                View all →
              </Link>
            </div>
            {recentApps && recentApps.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentApps.map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/admin/applications/$appId"
                      params={{ appId: a.id }}
                      className="flex items-center gap-3 py-3 transition hover:bg-muted/40 -mx-2 px-2 rounded-lg"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold uppercase text-primary">
                        {a.full_name.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{a.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.jobs?.title ?? "—"}</p>
                      </div>
                      <StatusPill status={a.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No applications yet" />
            )}
          </CardContent>
        </Card>

        {/* Top jobs */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={Briefcase} title="Top jobs" subtitle="By applications" compact />
              <Link to="/admin/jobs" className="text-xs font-medium text-primary hover:underline">
                Manage →
              </Link>
            </div>
            {topJobs && topJobs.length > 0 ? (
              <ul className="space-y-3">
                {topJobs.map((j) => (
                  <li key={j.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">{j.title}</p>
                      <span className="text-xs font-semibold tabular-nums text-primary">{j.applicants}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (j.applicants / Math.max(1, topJobs[0].applicants)) * 100)}%`,
                        }}
                      />
                    </div>
                    {j.department && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{j.department}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No open jobs yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <ActionTile to="/admin/jobs" icon={Briefcase} title="Manage jobs" desc="Create, edit, publish, or close vacancies." />
        <ActionTile to="/admin/applications" icon={Users} title="Review applicants" desc="Move candidates through the pipeline." />
        <ActionTile to="/admin/departments" icon={Building2} title="Departments" desc="Customize forms by department." />
      </div>
    </>
  );
}

/* ============================ APPLICANT VIEW ============================ */
function ApplicantView({
  myAppCount,
  myCountLoading,
  openJobs,
  profileComplete,
  breakdown,
  recentApps,
  latestJobs,
}: {
  myAppCount: number | undefined;
  myCountLoading: boolean;
  openJobs: number;
  profileComplete: boolean;
  breakdown: Record<string, number> | undefined;
  recentApps: RecentApp[] | undefined;
  latestJobs: RecentJob[] | undefined;
}) {
  const pending = breakdown?.pending ?? 0;
  const hired = breakdown?.hired ?? 0;

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {myCountLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : (
            <>
              <Stat icon={FileText} label="My applications" value={myAppCount ?? 0} sub="Total submitted" accent />
              <Stat icon={Clock} label="In review" value={pending} sub="Awaiting decision" />
              <Stat icon={CheckCircle2} label="Hired" value={hired} sub="Congrats!" accent />
              <Stat icon={Briefcase} label="Open roles" value={openJobs} sub="Available now" />
            </>
          )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        {/* My applications */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={FileText} title="My recent applications" subtitle="Track your latest submissions" compact />
              <Link to="/applications" className="text-xs font-medium text-primary hover:underline">
                View all →
              </Link>
            </div>
            {recentApps && recentApps.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentApps.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{a.jobs?.title ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusPill status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="You haven't applied to anything yet — browse open roles!" />
            )}
          </CardContent>
        </Card>

        {/* Latest jobs */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={Sparkles} title="Fresh openings" subtitle="Newest roles" compact />
              <Link to="/jobs" className="text-xs font-medium text-primary hover:underline">
                Browse →
              </Link>
            </div>
            {latestJobs && latestJobs.length > 0 ? (
              <ul className="space-y-3">
                {latestJobs.map((j) => (
                  <li key={j.id}>
                    <Link
                      to="/jobs/$jobId"
                      params={{ jobId: j.id }}
                      className="block rounded-lg border border-border p-3 transition hover:border-primary/40 hover:bg-muted/30"
                    >
                      <p className="truncate text-sm font-medium text-foreground">{j.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[j.department, j.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No openings right now — check back soon." />
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <ActionTile to="/jobs" icon={Briefcase} title="Browse open roles" desc="Find a position that matches you." />
        <ActionTile to="/applications" icon={FileText} title="My applications" desc="Track every status update." />
        <ActionTile
          to="/profile"
          icon={UserIcon}
          title={profileComplete ? "Edit profile" : "Complete your profile"}
          desc={profileComplete ? "Keep your details fresh." : "Boost your chances — add your details."}
        />
      </div>
    </>
  );
}

/* ============================ SHARED ============================ */
function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="transition hover:shadow-md">
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            accent ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary-soft text-primary"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-2xl font-bold tracking-tight text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {sub && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">{sub}</div>}
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

function ActionTile({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="truncate text-base font-semibold text-foreground">{title}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mb-4"}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {subtitle && <p className="ml-6 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function PipelineBar({ pipeline }: { pipeline: Record<string, number> | undefined }) {
  const total = APPLICATION_STATUSES.reduce((sum, s) => sum + (pipeline?.[s] ?? 0), 0);
  if (!pipeline || total === 0) {
    return <EmptyState message="No applications to break down yet." />;
  }
  const colors: Record<string, string> = {
    pending: "bg-amber-500",
    reviewing: "bg-blue-500",
    shortlisted: "bg-violet-500",
    interview: "bg-cyan-500",
    offer: "bg-emerald-500",
    hired: "bg-primary",
    rejected: "bg-rose-500",
  };
  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {APPLICATION_STATUSES.map((s) => {
          const v = pipeline[s] ?? 0;
          if (!v) return null;
          return (
            <div
              key={s}
              className={`${colors[s] ?? "bg-muted-foreground"} transition-all`}
              style={{ width: `${(v / total) * 100}%` }}
              title={`${STATUS_LABELS[s]}: ${v}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {APPLICATION_STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${colors[s] ?? "bg-muted-foreground"}`} />
            <span className="text-muted-foreground">{STATUS_LABELS[s]}</span>
            <span className="font-semibold tabular-nums text-foreground">{pipeline[s] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    reviewing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    shortlisted: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    interview: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
    offer: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    hired: "bg-primary/15 text-primary",
    rejected: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone[status] ?? "bg-muted text-muted-foreground"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <XCircle className="h-5 w-5 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

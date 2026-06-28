import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoles } from "@/hooks/useRoles";
import { Briefcase, Users, FileText, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data,
  });
  const { data: roles } = useRoles(user.id);
  const isAdmin = roles?.includes("admin");

  const { data: adminStats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
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

  const { data: myAppCount } = useQuery({
    queryKey: ["my-app-count", user.id],
    enabled: !isAdmin && !!roles,
    queryFn: async () => {
      const { count } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", user.id);
      return count ?? 0;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isAdmin ? "Manage job posts and review applicants." : "Find your next role and track applications."}
        </p>

        {isAdmin ? (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <Stat icon={Briefcase} label="Total jobs" value={adminStats?.jobs ?? "—"} />
              <Stat icon={Briefcase} label="Open jobs" value={adminStats?.openJobs ?? "—"} accent />
              <Stat icon={Inbox} label="Applications" value={adminStats?.apps ?? "—"} />
              <Stat icon={FileText} label="Pending review" value={adminStats?.pending ?? "—"} accent />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DashLink to="/admin/jobs" icon={Briefcase} title="Manage jobs" desc="Create, edit, publish, or close vacancies." />
              <DashLink to="/admin/applications" icon={Users} title="Review applicants" desc="Move candidates through the pipeline." />
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Stat icon={FileText} label="My applications" value={myAppCount ?? "—"} accent />
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Role</CardTitle></CardHeader>
                <CardContent><Badge>Applicant</Badge></CardContent>
              </Card>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DashLink to="/jobs" icon={Briefcase} title="Browse open roles" desc="Find a position that matches you." />
              <DashLink to="/applications" icon={FileText} title="My applications" desc="Track the status of every application." />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashLink({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="transition hover:border-primary/40 hover:-translate-y-0.5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">{desc}</CardContent>
      </Card>
    </Link>
  );
}

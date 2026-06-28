import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/khatiana-logo.png.asset.json";
import { LogOut, Briefcase, Users, BarChart3 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["roles", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return data?.map((r) => r.role) ?? [];
    },
  });

  const isAdmin = roles?.includes("admin");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="Khatiana" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">{profile?.full_name || user.email}</div>
              <Badge variant="secondary" className="mt-0.5">
                {isAdmin ? "Admin" : "Applicant"}
              </Badge>
            </div>
            <Button variant="outline" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isAdmin
            ? "Manage job posts, review applicants, and track your hiring pipeline."
            : "Browse open roles and track your applications."}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {isAdmin ? (
            <>
              <DashCard icon={Briefcase} title="Job posts" desc="Create and manage vacancies" comingSoon />
              <DashCard icon={Users} title="Applicants" desc="Review and score candidates" comingSoon />
              <DashCard icon={BarChart3} title="Analytics" desc="Pipeline & hiring stats" comingSoon />
            </>
          ) : (
            <>
              <DashCard icon={Briefcase} title="Browse jobs" desc="See open roles" comingSoon />
              <DashCard icon={Users} title="My applications" desc="Track your application status" comingSoon />
            </>
          )}
        </div>

        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Phase 1 complete</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Auth, roles, and the brand shell are in place. Next phases will add Job Post Management,
            Applicant Review, CV upload &amp; viewer, Quality Match scoring, and the Form Builder.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function DashCard({
  icon: Icon,
  title,
  desc,
  comingSoon,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  comingSoon?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {comingSoon && <Badge variant="outline">Soon</Badge>}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}

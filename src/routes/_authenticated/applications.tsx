import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/positions";

export const Route = createFileRoute("/_authenticated/applications")({
  component: MyApplications,
});

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "hired") return "default";
  if (s === "rejected") return "destructive";
  if (s === "shortlisted" || s === "interviewed") return "default";
  return "secondary";
}

function MyApplications() {
  const { user } = Route.useRouteContext();
  const { data: apps, isLoading } = useQuery({
    queryKey: ["my-applications", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, jobs(title, department, location)")
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My applications</h1>
        <p className="mt-2 text-muted-foreground">Track the status of every role you've applied to.</p>

        <div className="mt-8 space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (apps ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                You haven't applied yet.{" "}
                <Link to="/jobs" className="text-primary underline">Browse open roles</Link>.
              </CardContent>
            </Card>
          ) : (
            apps!.map((a) => {
              const job = a.jobs as { title: string; department: string | null; location: string | null } | null;
              return (
                <Card key={a.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <Link to="/jobs/$jobId" params={{ jobId: a.job_id }} className="font-semibold text-foreground hover:underline">
                        {job?.title ?? "Job"}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {job?.department}{job?.department && job?.location ? " • " : ""}{job?.location}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Submitted {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={statusVariant(a.status)}>{STATUS_LABELS[a.status]}</Badge>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
    </main>
  );
}

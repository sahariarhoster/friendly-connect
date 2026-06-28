import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { STATUS_LABELS } from "@/lib/positions";
import { FileText, Briefcase, MapPin, ArrowRight, Inbox } from "lucide-react";

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
    staleTime: 30_000,
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
    <main className="mx-auto max-w-5xl px-6 py-8">
      <PageHeader
        icon={FileText}
        eyebrow="My applications"
        title="Track every application"
        description="Stay up to date on the status of every role you've applied to."
      />

      <div className="mt-8 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="py-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))
        ) : (apps ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Inbox}
                title="No applications yet"
                description="Browse open roles and submit your first application."
                action={
                  <Link to="/jobs">
                    <Button className="mt-2">Browse open roles <ArrowRight className="ml-1 h-4 w-4" /></Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : (
          apps!.map((a) => {
            const job = a.jobs as { title: string; department: string | null; location: string | null } | null;
            return (
              <Card key={a.id} className="transition hover:border-primary/40 hover:shadow-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <Link to="/jobs/$jobId" params={{ jobId: a.job_id }} className="font-semibold text-foreground hover:underline">
                      {job?.title ?? "Job"}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {job?.department && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.department}</span>}
                      {job?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      <span>Submitted {new Date(a.created_at).toLocaleDateString()}</span>
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


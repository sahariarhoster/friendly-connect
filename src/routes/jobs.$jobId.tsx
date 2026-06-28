import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { POSITION_LABELS, type PositionType } from "@/lib/positions";
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetail,
  errorComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted-foreground">Could not load this job.</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted-foreground">Job not found.</div>
    </AppShell>
  ),
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> All jobs
          </Link>

          {isLoading ? (
            <Card><CardContent className="space-y-4 p-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </CardContent></Card>
          ) : job ? (
            <>
              <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-primary-soft/40 to-card p-6 sm:p-8">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
                <div className="relative flex flex-wrap items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary">{POSITION_LABELS[job.position_type as PositionType]}</Badge>
                    </div>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{job.title}</h1>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      {job.department && <span className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {job.department}</span>}
                      {job.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location}</span>}
                      {job.employment_type && <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-medium">{job.employment_type}</span>}
                      {job.salary_range && <span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {job.salary_range}</span>}
                      {job.deadline && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> Apply by {new Date(job.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                    <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                      Apply now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </section>

              <Card>
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">About the role</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.description}</p>
                  </div>
                  {job.requirements && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Requirements</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.requirements}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                  <Button size="lg" className="gap-2">
                    Apply for this role <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

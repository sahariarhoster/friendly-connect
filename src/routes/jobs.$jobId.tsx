import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { POSITION_LABELS, type PositionType } from "@/lib/positions";
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign } from "lucide-react";

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetail,
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Could not load this job.</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    </div>
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
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All jobs
        </Link>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : job ? (
          <>
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="secondary">{POSITION_LABELS[job.position_type as PositionType]}</Badge>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">{job.title}</h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  {job.department && <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.department}</span>}
                  {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>}
                  {job.employment_type && <span>{job.employment_type}</span>}
                  {job.salary_range && <span className="inline-flex items-center gap-1"><DollarSign className="h-4 w-4" /> {job.salary_range}</span>}
                  {job.deadline && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> Apply by {new Date(job.deadline).toLocaleDateString()}</span>}
                </div>
              </div>
              <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                <Button size="lg">Apply now</Button>
              </Link>
            </div>

            <Card className="mt-8">
              <CardContent className="prose prose-sm max-w-none whitespace-pre-wrap py-6 text-foreground">
                <h3 className="mb-2 text-base font-semibold">About the role</h3>
                <p className="text-sm text-muted-foreground">{job.description}</p>
                {job.requirements && (
                  <>
                    <h3 className="mb-2 mt-6 text-base font-semibold">Requirements</h3>
                    <p className="text-sm text-muted-foreground">{job.requirements}</p>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                <Button size="lg">Apply for this role</Button>
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

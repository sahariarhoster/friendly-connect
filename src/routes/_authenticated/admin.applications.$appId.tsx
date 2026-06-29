import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/positions";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Inbox } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applications/$appId")({
  component: ApplicationDetail,
});

type AppRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  custom_responses: Record<string, string>;
  status: string;
  admin_notes: string | null;
  created_at: string;
  jobs: { title: string; position_type: string } | null;
};

function ApplicationDetail() {
  const { appId } = Route.useParams();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [resumeSignedUrl, setResumeSignedUrl] = useState<string | null>(null);

  const { data: app, isLoading } = useQuery({
    queryKey: ["admin-application", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, jobs(title, position_type)")
        .eq("id", appId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AppRow | null;
    },
  });

  useEffect(() => {
    if (app) setNotes(app.admin_notes ?? "");
  }, [app]);

  useEffect(() => {
    (async () => {
      if (!app?.resume_url) return;
      const { data } = await supabase.storage.from("resumes").createSignedUrl(app.resume_url, 300);
      setResumeSignedUrl(data?.signedUrl ?? null);
    })();
  }, [app?.resume_url]);

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("job_applications").update({ status: status as never }).eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-application", appId] });
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("job_applications").update({ admin_notes: notes }).eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Notes saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <main className="mx-auto max-w-4xl px-6 py-8 text-muted-foreground">Loading…</main>;
  }
  if (!app) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Application not found</h1>
        <Link to="/admin/applications"><Button className="mt-4">Back to applications</Button></Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <Link to="/admin/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to applications
      </Link>

      <PageHeader
        icon={Inbox}
        eyebrow="Admin · Application"
        title={app.full_name}
        description={`Submitted ${new Date(app.created_at).toLocaleString()}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/70">
          <CardContent className="space-y-6 p-6">
            <section>
              <div className="text-xs uppercase text-muted-foreground">Contact</div>
              <div className="mt-1 text-sm">{app.email}</div>
              {app.phone && <div className="text-sm">{app.phone}</div>}
              {app.portfolio_url && (
                <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                  Portfolio / LinkedIn
                </a>
              )}
            </section>

            {app.resume_url && (
              <section>
                <div className="text-xs uppercase text-muted-foreground">Resume</div>
                {resumeSignedUrl ? (
                  <a href={resumeSignedUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                    Open resume
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
              </section>
            )}

            {app.cover_letter && (
              <section>
                <div className="text-xs uppercase text-muted-foreground">Cover letter</div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{app.cover_letter}</p>
              </section>
            )}

            {Object.keys(app.custom_responses ?? {}).length > 0 && (
              <section>
                <div className="mb-2 text-xs uppercase text-muted-foreground">Position-specific answers</div>
                <div className="space-y-3 rounded border border-border bg-muted/30 p-4">
                  {Object.entries(app.custom_responses).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs font-medium text-foreground">{k.replace(/_/g, " ")}</div>
                      <div className="text-sm text-muted-foreground break-words">{v || "—"}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardContent className="space-y-4 p-6">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Applied for</div>
                <div className="mt-1 text-sm font-medium">{app.jobs?.title ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Status</div>
                <Badge variant="secondary" className="mt-1">{STATUS_LABELS[app.status]}</Badge>
                <Select value={app.status} onValueChange={(v) => updateStatus.mutate(v)}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="space-y-3 p-6">
              <div className="text-xs uppercase text-muted-foreground">Internal notes</div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} />
              <Button size="sm" onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending} className="w-full">
                Save notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

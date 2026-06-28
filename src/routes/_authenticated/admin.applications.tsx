import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/positions";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Inbox } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: AdminApplications,
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

function AdminApplications() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");

  const { data: jobs } = useQuery({
    queryKey: ["admin-jobs-list"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("id, title").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*, jobs(title, position_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AppRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("job_applications").update({ status: status as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (apps ?? []).filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (jobFilter !== "all" && a.job_id !== jobFilter) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-sm text-muted-foreground">Review applicants and move them through the pipeline.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-64"><SelectValue placeholder="All jobs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {(jobs ?? []).map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-muted-foreground">No applications match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                    </TableCell>
                    <TableCell>{a.jobs?.title ?? "—"}</TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Select value={a.status} onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <ApplicantSheet app={a} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function ApplicantSheet({ app }: { app: AppRow }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(app.admin_notes ?? "");
  const [resumeSignedUrl, setResumeSignedUrl] = useState<string | null>(null);

  async function loadResume() {
    if (!app.resume_url) return;
    const { data } = await supabase.storage.from("resumes").createSignedUrl(app.resume_url, 300);
    setResumeSignedUrl(data?.signedUrl ?? null);
  }

  const saveNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("job_applications").update({ admin_notes: notes }).eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("Notes saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet onOpenChange={(o) => o && loadResume()}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">View</Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{app.full_name}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Contact</div>
            <div className="text-sm">{app.email}</div>
            {app.phone && <div className="text-sm">{app.phone}</div>}
            {app.portfolio_url && (
              <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                Portfolio / LinkedIn
              </a>
            )}
          </div>

          <div>
            <div className="text-xs uppercase text-muted-foreground">Applied for</div>
            <div className="text-sm">{app.jobs?.title}</div>
            <Badge variant="secondary" className="mt-1">{STATUS_LABELS[app.status]}</Badge>
          </div>

          {app.resume_url && (
            <div>
              <div className="text-xs uppercase text-muted-foreground">Resume</div>
              {resumeSignedUrl ? (
                <a href={resumeSignedUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                  Open resume
                </a>
              ) : (
                <Button size="sm" variant="outline" onClick={loadResume}>Load resume</Button>
              )}
            </div>
          )}

          {app.cover_letter && (
            <div>
              <div className="text-xs uppercase text-muted-foreground">Cover letter</div>
              <p className="whitespace-pre-wrap text-sm">{app.cover_letter}</p>
            </div>
          )}

          {Object.keys(app.custom_responses ?? {}).length > 0 && (
            <div>
              <div className="mb-2 text-xs uppercase text-muted-foreground">Position-specific answers</div>
              <div className="space-y-3 rounded border border-border bg-muted/30 p-3">
                {Object.entries(app.custom_responses).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs font-medium text-foreground">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm text-muted-foreground">{v || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs uppercase text-muted-foreground">Internal notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1" />
            <Button size="sm" className="mt-2" onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending}>
              Save notes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

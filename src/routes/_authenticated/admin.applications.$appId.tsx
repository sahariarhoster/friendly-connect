import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/positions";
import { ArrowLeft, Mail, Phone, FileText, ExternalLink, UserCircle2, NotebookPen, Trash2, Plus } from "lucide-react";
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

type Note = { id: string; text: string; author: string | null; created_at: string };

function parseNotes(raw: string | null): Note[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Note[];
  } catch {
    // legacy single string
  }
  return [{ id: "legacy", text: raw, author: null, created_at: "" }];
}

function ApplicationDetail() {
  const { appId } = Route.useParams();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
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

  const notes = parseNotes(app?.admin_notes ?? null);

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

  const persistNotes = useMutation({
    mutationFn: async (next: Note[]) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ admin_notes: JSON.stringify(next) })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-application", appId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = async () => {
    const text = draft.trim();
    if (!text) return;
    const { data: u } = await supabase.auth.getUser();
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      author: u.user?.email ?? null,
      created_at: new Date().toISOString(),
    };
    setDraft("");
    persistNotes.mutate([...notes, note]);
  };

  const deleteNote = (id: string) => {
    persistNotes.mutate(notes.filter((n) => n.id !== id));
  };

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-12 text-muted-foreground">Loading…</main>;
  }
  if (!app) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Application not found</h1>
        <Link to="/admin/applications"><Button className="mt-4">Back to applications</Button></Link>
      </main>
    );
  }


  const responses = Object.entries(app.custom_responses ?? {});

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 md:py-12">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2">
          <div>
            <Link
              to="/admin/applications"
              className="group mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to applications
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Application Profile</span>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{app.full_name}</h1>
                <p className="text-sm text-muted-foreground">
                  Submitted on {new Date(app.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  {" · "}
                  {new Date(app.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${app.email}`}>
                <Mail className="h-4 w-4" />
                Email candidate
              </a>
            </Button>
            {resumeSignedUrl && (
              <Button asChild size="sm">
                <a href={resumeSignedUrl} target="_blank" rel="noreferrer">
                  <FileText className="h-4 w-4" />
                  Open resume
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Main */}
          <div className="col-span-12 space-y-6 lg:col-span-8">
            {/* Candidate Overview */}
            <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/60 p-6">
                <h2 className="text-sm font-semibold text-foreground">Candidate Overview</h2>
              </div>
              <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Details</label>
                  <div className="mt-3 space-y-2">
                    <a
                      href={`mailto:${app.email}`}
                      className="flex items-center gap-3 text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{app.email}</span>
                    </a>
                    {app.phone && (
                      <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {app.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documents</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resumeSignedUrl ? (
                      <a
                        href={resumeSignedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
                      >
                        <FileText className="h-4 w-4" />
                        Resume
                      </a>
                    ) : app.resume_url ? (
                      <span className="text-sm text-muted-foreground">Loading resume…</span>
                    ) : null}
                    {app.portfolio_url && (
                      <a
                        href={app.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Portfolio
                      </a>
                    )}
                    {!app.resume_url && !app.portfolio_url && (
                      <span className="text-sm text-muted-foreground">No documents shared</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Cover letter */}
            {app.cover_letter && (
              <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                <div className="border-b border-border/60 p-6">
                  <h2 className="text-sm font-semibold text-foreground">Cover Letter</h2>
                </div>
                <div className="p-6">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{app.cover_letter}</p>
                </div>
              </section>
            )}

            {/* Application answers */}
            {responses.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 p-6">
                  <h2 className="text-sm font-semibold text-foreground">Application Answers</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {responses.length} {responses.length === 1 ? "Question" : "Questions"}
                  </span>
                </div>
                <div className="divide-y divide-border/60">
                  {responses.map(([k, v]) => (
                    <div key={k} className="space-y-2 p-6">
                      <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">
                        {k.replace(/_/g, " ")}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/80">
                        {v || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-12 space-y-6 lg:col-span-4">
            <div className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Role</label>
                <p className="text-lg font-bold leading-tight text-foreground">{app.jobs?.title ?? "—"}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Application Status
                </label>
                <Select value={app.status} onValueChange={(v) => updateStatus.mutate(v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <NotebookPen className="h-3 w-3" />
                Internal Review Notes
              </label>

              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No notes yet. Add the first one below.</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((n) => (
                    <li
                      key={n.id}
                      className="group relative rounded-xl border border-border/60 bg-muted/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        <span className="truncate">
                          {n.author ?? "Unknown"}
                          {n.created_at && (
                            <>
                              {" · "}
                              {new Date(n.created_at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteNote(n.id)}
                          className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                        {n.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 border-t border-border/60 pt-4">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      addNote();
                    }
                  }}
                  placeholder="Write a note… (⌘/Ctrl + Enter to add)"
                  className="min-h-[90px] resize-none rounded-xl bg-muted/40"
                />
                <Button
                  onClick={addNote}
                  disabled={!draft.trim() || persistNotes.isPending}
                  className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background hover:bg-foreground/90"
                >
                  <Plus className="h-4 w-4" />
                  Add note
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

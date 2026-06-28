import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CUSTOM_FIELDS, POSITION_LABELS, type PositionType, type CustomField } from "@/lib/positions";
import { useDepartments } from "@/hooks/useDepartments";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/apply/$jobId")({
  component: ApplyPage,
});

function ApplyPage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) setUser({ id: data.session.user.id, email: data.session.user.email ?? null });
    });
  }, []);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-public", jobId],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
      return data as (Record<string, unknown> & { custom_fields?: CustomField[]; use_position_defaults?: boolean; use_department_defaults?: boolean; department?: string | null }) | null;
    },
  });
  const { data: departments = [] } = useDepartments();

  const submit = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { error } = await supabase.from("job_applications").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted!");
      setSubmitted(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleResumeUpload(file: File) {
    setUploading(true);
    const folder = user?.id ?? `guest/${crypto.randomUUID()}`;
    const path = `${folder}/${jobId}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) return toast.error(error.message);
    setResumeUrl(path);
    toast.success("Resume uploaded");
  }

  function getActiveFields(): CustomField[] {
    if (!job) return [];
    const posType = job.position_type as PositionType;
    const custom = (job.custom_fields ?? []) as CustomField[];
    const usePositionDefaults = job.use_position_defaults ?? true;
    const useDepartmentDefaults = job.use_department_defaults ?? true;
    const positionDefaults = usePositionDefaults ? CUSTOM_FIELDS[posType] ?? [] : [];
    const dept = departments.find((d) => d.name === job.department);
    const departmentDefaults = useDepartmentDefaults ? (dept?.custom_fields ?? []) : [];
    // Dedup by key, order: department → position → custom
    const merged: CustomField[] = [];
    const seen = new Set<string>();
    for (const f of [...departmentDefaults, ...positionDefaults, ...custom]) {
      if (seen.has(f.key)) continue;
      seen.add(f.key);
      merged.push(f);
    }
    return merged;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!job) return;
    const fd = new FormData(e.currentTarget);
    const fields = getActiveFields();
    const custom_responses: Record<string, string> = {};
    for (const f of fields) {
      const v = String(fd.get(`cf_${f.key}`) ?? "");
      if (f.required && !v.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
      custom_responses[f.key] = v;
    }
    submit.mutate({
      job_id: jobId,
      applicant_id: user?.id ?? null,
      full_name: String(fd.get("full_name") ?? ""),
      email: String(fd.get("email") ?? user?.email ?? ""),
      phone: String(fd.get("phone") ?? "") || null,
      cover_letter: String(fd.get("cover_letter") ?? "") || null,
      portfolio_url: String(fd.get("portfolio_url") ?? "") || null,
      resume_url: resumeUrl,
      custom_responses,
    });
  }

  if (isLoading || !job) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-4 text-3xl font-bold">Application received</h1>
          <p className="mt-2 text-muted-foreground">Thanks for applying to {String(job.title)}. We'll be in touch.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/jobs"><Button variant="outline">Browse more roles</Button></Link>
            {user && <Link to="/applications"><Button>Track my applications</Button></Link>}
            {!user && (
              <Button onClick={() => navigate({ to: "/auth" })}>
                Create account to track
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const fields = getActiveFields();
  const posType = job.position_type as PositionType;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/jobs/$jobId" params={{ jobId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to job
        </Link>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Apply: {String(job.title)}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {POSITION_LABELS[posType]} application form
              {!user && " · No account needed"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input id="full_name" name="full_name" required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" defaultValue={user?.email ?? ""} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" maxLength={30} />
                </div>
                <div>
                  <Label htmlFor="portfolio_url">Portfolio / LinkedIn URL</Label>
                  <Input id="portfolio_url" name="portfolio_url" type="url" />
                </div>
              </div>

              <div>
                <Label htmlFor="resume">Resume (PDF/DOC)</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleResumeUpload(f);
                  }}
                />
                {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
                {resumeUrl && <p className="mt-1 text-xs text-primary">Resume uploaded ✓</p>}
              </div>

              <div>
                <Label htmlFor="cover_letter">Cover letter</Label>
                <Textarea id="cover_letter" name="cover_letter" rows={5} maxLength={3000} placeholder="Why are you a good fit?" />
              </div>

              {fields.length > 0 && (
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Role-specific questions</h3>
                  {fields.map((f) => (
                    <div key={f.key}>
                      <Label htmlFor={`cf_${f.key}`}>
                        {f.label} {f.required && "*"}
                      </Label>
                      {f.type === "textarea" ? (
                        <Textarea id={`cf_${f.key}`} name={`cf_${f.key}`} rows={3} placeholder={f.placeholder} />
                      ) : f.type === "select" ? (
                        <Select name={`cf_${f.key}`}>
                          <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                          <SelectContent>
                            {(f.options ?? []).map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`cf_${f.key}`}
                          name={`cf_${f.key}`}
                          type={f.type === "url" ? "url" : f.type === "number" ? "number" : "text"}
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" size="lg" disabled={submit.isPending || uploading} className="w-full">
                {submit.isPending ? "Submitting…" : "Submit application"}
              </Button>
              {!user && (
                <p className="text-center text-xs text-muted-foreground">
                  Want to track your applications?{" "}
                  <Link to="/auth" className="text-primary hover:underline">Create an account</Link>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

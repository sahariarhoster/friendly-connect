import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { POSITION_LABELS, DEPARTMENTS, type PositionType } from "@/lib/positions";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  component: AdminJobs,
});

type JobRow = {
  id: string;
  title: string;
  department: string | null;
  position_type: string;
  description: string;
  requirements: string | null;
  location: string | null;
  employment_type: string | null;
  salary_range: string | null;
  status: string;
  deadline: string | null;
};

function emptyJob(): Partial<JobRow> {
  return { title: "", department: "", position_type: "other", description: "", requirements: "", location: "", employment_type: "", salary_range: "", status: "draft", deadline: null };
}

function AdminJobs() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<JobRow> | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as JobRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (job: Partial<JobRow>) => {
      const payload = {
        title: job.title!,
        department: job.department || null,
        position_type: job.position_type as PositionType,
        description: job.description!,
        requirements: job.requirements || null,
        location: job.location || null,
        employment_type: job.employment_type || null,
        salary_range: job.salary_range || null,
        status: job.status as "draft" | "open" | "closed",
        deadline: job.deadline || null,
      };
      if (job.id) {
        const { error } = await supabase.from("jobs").update(payload).eq("id", job.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("jobs").insert({ ...payload, created_by: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["public-jobs"] });
      setDialogOpen(false);
      setEditing(null);
      toast.success("Job saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["public-jobs"] });
      toast.success("Job deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() { setEditing(emptyJob()); setDialogOpen(true); }
  function openEdit(j: JobRow) { setEditing({ ...j }); setDialogOpen(true); }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job posts</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and publish vacancies.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> New job</Button>
          </DialogTrigger>
          <JobDialog
            editing={editing}
            setEditing={setEditing}
            onSubmit={() => editing && save.mutate(editing)}
            saving={save.isPending}
          />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : (jobs ?? []).length === 0 ? (
            <p className="p-6 text-muted-foreground">No jobs yet. Create your first vacancy.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs!.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>
                      <div className="font-medium">{j.title}</div>
                      <div className="text-xs text-muted-foreground">{j.department}{j.location ? ` • ${j.location}` : ""}</div>
                    </TableCell>
                    <TableCell>{POSITION_LABELS[j.position_type as PositionType]}</TableCell>
                    <TableCell>
                      <Badge variant={j.status === "open" ? "default" : j.status === "closed" ? "destructive" : "secondary"}>
                        {j.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{j.deadline ? new Date(j.deadline).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(j)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this job?")) del.mutate(j.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

function JobDialog({
  editing, setEditing, onSubmit, saving,
}: {
  editing: Partial<JobRow> | null;
  setEditing: (j: Partial<JobRow>) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  if (!editing) return null;
  const set = (k: keyof JobRow, v: unknown) => setEditing({ ...editing, [k]: v });
  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing.id ? "Edit job" : "New job"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Title *</Label>
          <Input value={editing.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Position type *</Label>
            <Select value={editing.position_type ?? "other"} onValueChange={(v) => set("position_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(POSITION_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={editing.status ?? "draft"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Input value={editing.department ?? ""} onChange={(e) => set("department", e.target.value)} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={editing.location ?? ""} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <Label>Employment type</Label>
            <Input placeholder="Full-time, Contract…" value={editing.employment_type ?? ""} onChange={(e) => set("employment_type", e.target.value)} />
          </div>
          <div>
            <Label>Salary range</Label>
            <Input value={editing.salary_range ?? ""} onChange={(e) => set("salary_range", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Deadline</Label>
            <Input type="date" value={editing.deadline ? editing.deadline.slice(0, 10) : ""} onChange={(e) => set("deadline", e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
        </div>
        <div>
          <Label>Description *</Label>
          <Textarea rows={5} value={editing.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <Label>Requirements</Label>
          <Textarea rows={4} value={editing.requirements ?? ""} onChange={(e) => set("requirements", e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={saving || !editing.title || !editing.description}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { POSITION_LABELS, OFFICES, CUSTOM_FIELDS, type PositionType, type CustomField, type CustomFieldType } from "@/lib/positions";
import { useDepartments } from "@/hooks/useDepartments";
import { Plus, Pencil, Trash2, Link2, GripVertical } from "lucide-react";
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
  custom_fields: CustomField[];
  use_position_defaults: boolean;
};

function emptyJob(): Partial<JobRow> {
  return {
    title: "", department: "", position_type: "other", description: "", requirements: "",
    location: "", employment_type: "Full-time", salary_range: "", status: "draft", deadline: null,
    custom_fields: [], use_position_defaults: true,
  };
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
      return (data ?? []) as unknown as JobRow[];
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
        custom_fields: (job.custom_fields ?? []) as unknown as never,
        use_position_defaults: job.use_position_defaults ?? true,
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
  function openEdit(j: JobRow) {
    setEditing({ ...j, custom_fields: j.custom_fields ?? [], use_position_defaults: j.use_position_defaults ?? true });
    setDialogOpen(true);
  }

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
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copy apply link"
                        onClick={async () => {
                          const url = `${window.location.origin}/apply/${j.id}`;
                          try {
                            await navigator.clipboard.writeText(url);
                            toast.success("Apply link copied", { description: url });
                          } catch {
                            toast.error("Could not copy link");
                          }
                        }}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
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
  const { data: departments = [] } = useDepartments();
  if (!editing) return null;
  const set = (k: keyof JobRow, v: unknown) => setEditing({ ...editing, [k]: v });
  const fields = editing.custom_fields ?? [];
  const setFields = (next: CustomField[]) => set("custom_fields", next);
  const defaults = CUSTOM_FIELDS[(editing.position_type ?? "other") as PositionType] ?? [];

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
            <Select value={editing.department ?? ""} onValueChange={(v) => set("department", v)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Office location</Label>
            <Select value={editing.location ?? ""} onValueChange={(v) => set("location", v)}>
              <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
              <SelectContent>
                {OFFICES.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Employment type</Label>
            <Select value={editing.employment_type ?? ""} onValueChange={(v) => set("employment_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Form builder */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Application form questions</h3>
              <p className="text-xs text-muted-foreground">Customize what applicants are asked for this role.</p>
            </div>
          </div>

          {defaults.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <div>
                <div className="text-sm font-medium">Include {POSITION_LABELS[editing.position_type as PositionType]} default questions</div>
                <div className="text-xs text-muted-foreground">{defaults.map((d) => d.label).join(" · ")}</div>
              </div>
              <Switch
                checked={editing.use_position_defaults ?? true}
                onCheckedChange={(v) => set("use_position_defaults", v)}
              />
            </div>
          )}

          <div className="space-y-3">
            {fields.length === 0 && (
              <p className="text-xs text-muted-foreground">No custom questions yet. Add one below.</p>
            )}
            {fields.map((f, i) => (
              <FieldEditor
                key={i}
                field={f}
                onChange={(next) => setFields(fields.map((x, idx) => (idx === i ? next : x)))}
                onRemove={() => setFields(fields.filter((_, idx) => idx !== i))}
                onMove={(dir) => {
                  const j = i + dir;
                  if (j < 0 || j >= fields.length) return;
                  const next = [...fields];
                  [next[i], next[j]] = [next[j], next[i]];
                  setFields(next);
                }}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setFields([
                ...fields,
                { key: `q_${fields.length + 1}_${Math.random().toString(36).slice(2, 6)}`, label: "", type: "text", required: false },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add question
          </Button>
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

function FieldEditor({
  field, onChange, onRemove, onMove,
}: {
  field: CustomField;
  onChange: (f: CustomField) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Question label (e.g. Years of experience)"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="flex-1"
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => onMove(-1)} title="Move up">↑</Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => onMove(1)} title="Move down">↓</Button>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} title="Remove">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={field.type} onValueChange={(v) => onChange({ ...field, type: v as CustomFieldType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Short text</SelectItem>
              <SelectItem value="textarea">Long text</SelectItem>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input value={field.placeholder ?? ""} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} />
        </div>
        <div className="flex items-end gap-2">
          <Switch checked={!!field.required} onCheckedChange={(v) => onChange({ ...field, required: v })} />
          <Label className="text-xs">Required</Label>
        </div>
      </div>
      {field.type === "select" && (
        <div>
          <Label className="text-xs">Options (one per line)</Label>
          <Textarea
            rows={3}
            value={(field.options ?? []).join("\n")}
            onChange={(e) => onChange({ ...field, options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
      )}
    </div>
  );
}

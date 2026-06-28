import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDepartments, type Department } from "@/hooks/useDepartments";
import { QuestionsDialog } from "@/components/QuestionsDialog";
import { type CustomField, getDepartmentDefaults } from "@/lib/positions";
import { Plus, Trash2, Building2, ListChecks, Sparkles } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/departments")({
  component: AdminDepartments,
});

function AdminDepartments() {
  const qc = useQueryClient();
  const { data: departments = [], isLoading } = useDepartments({ includeInactive: true });
  const [newName, setNewName] = useState("");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["departments"] });

  const add = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("departments").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setNewName(""); toast.success("Department added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Department> }) => {
      const payload: Record<string, unknown> = { ...patch };
      if (payload.custom_fields) payload.custom_fields = payload.custom_fields as unknown as never;
      const { error } = await supabase.from("departments").update(payload as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <PageHeader
        icon={Building2}
        eyebrow="Admin · Departments"
        title="Departments & form templates"
        description="Each department has its own default application questions. Jobs in that department inherit them automatically."
      />

      <Card className="border-border/70">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row">
          <Input
            placeholder="New department name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) add.mutate(newName.trim()); }}
          />
          <Button onClick={() => newName.trim() && add.mutate(newName.trim())} disabled={add.isPending || !newName.trim()} className="gap-1">
            <Plus className="h-4 w-4" /> Add department
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : departments.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No departments yet" description="Add your first department above." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {departments.map((d) => (
            <DepartmentCard
              key={d.id}
              dept={d}
              onSave={(patch) => update.mutate({ id: d.id, patch })}
              onDelete={() => { if (confirm(`Delete "${d.name}"?`)) del.mutate(d.id); }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function DepartmentCard({
  dept, onSave, onDelete,
}: {
  dept: Department;
  onSave: (patch: Partial<Department>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(dept.name);
  const fields: CustomField[] = dept.custom_fields ?? [];
  const suggested = getDepartmentDefaults(dept.name);
  const showSuggested = fields.length === 0 && suggested.length > 0;

  return (
    <Card className="overflow-hidden border-border/70 transition-shadow hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{dept.name}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="gap-1">
                  <ListChecks className="h-3 w-3" /> {fields.length} questions
                </Badge>
                {!dept.active && <Badge variant="outline">Inactive</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Switch checked={dept.active} onCheckedChange={(v) => onSave({ active: v })} />
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Department name"
          />
          <Button
            variant="outline"
            onClick={() => name.trim() && name !== dept.name && onSave({ name: name.trim() })}
            disabled={!name.trim() || name === dept.name}
          >
            Rename
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium">Default questions</div>
              <div className="text-xs text-muted-foreground">
                {fields.length === 0
                  ? showSuggested ? "Suggested template below — not yet saved" : "No questions set"
                  : `${fields.length} active`}
              </div>
            </div>
            <QuestionsDialog
              fields={fields}
              onSave={(next) => onSave({ custom_fields: next })}
              title={`${dept.name} default questions`}
              description="These questions are added to every job in this department."
              triggerLabel="Manage"
            />
          </div>

          {fields.length > 0 && (
            <ul className="space-y-1 text-xs text-foreground/80">
              {fields.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="truncate">{f.label || "Untitled"}</span>
                  {f.required && <span className="text-[10px] text-primary">*</span>}
                </li>
              ))}
            </ul>
          )}

          {showSuggested && (
            <div className="space-y-2 rounded-md border border-primary/30 bg-primary-soft/40 p-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Suggested for {dept.name}
              </div>
              <ul className="space-y-1 text-xs text-foreground/80">
                {suggested.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    <span className="truncate">{f.label}</span>
                    {f.required && <span className="text-[10px] text-primary">*</span>}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1"
                onClick={() => onSave({ custom_fields: suggested })}
              >
                <Sparkles className="h-3 w-3" /> Use these defaults
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


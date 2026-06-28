import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useDepartments, type Department } from "@/hooks/useDepartments";
import { FieldList } from "@/components/FieldEditor";
import type { CustomField } from "@/lib/positions";
import { Plus, Trash2 } from "lucide-react";
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
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Departments</h1>
        <p className="text-sm text-muted-foreground">
          Manage departments and the default application form questions for each.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex gap-2 p-4">
          <Input
            placeholder="New department name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) add.mutate(newName.trim()); }}
          />
          <Button onClick={() => newName.trim() && add.mutate(newName.trim())} disabled={add.isPending || !newName.trim()}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : departments.length === 0 ? (
        <Card><CardContent className="p-6 text-muted-foreground">No departments yet.</CardContent></Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {departments.map((d) => (
            <DepartmentRow
              key={d.id}
              dept={d}
              onSave={(patch) => update.mutate({ id: d.id, patch })}
              onDelete={() => { if (confirm(`Delete "${d.name}"?`)) del.mutate(d.id); }}
            />
          ))}
        </Accordion>
      )}
    </main>
  );
}

function DepartmentRow({
  dept, onSave, onDelete,
}: {
  dept: Department;
  onSave: (patch: Partial<Department>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(dept.name);
  const [fields, setFields] = useState<CustomField[]>(dept.custom_fields ?? []);

  return (
    <Card>
      <AccordionItem value={dept.id} className="border-0">
        <div className="flex items-center gap-3 px-4 py-2">
          <AccordionTrigger className="flex-1 py-2 hover:no-underline">
            <div className="flex flex-1 items-center gap-3 text-left">
              <span className="font-medium">{dept.name}</span>
              <Badge variant="secondary">{(dept.custom_fields ?? []).length} questions</Badge>
              {!dept.active && <Badge variant="outline">Inactive</Badge>}
            </div>
          </AccordionTrigger>
          <Switch
            checked={dept.active}
            onCheckedChange={(v) => onSave({ active: v })}
            onClick={(e) => e.stopPropagation()}
          />
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <AccordionContent>
          <CardContent className="space-y-4 pt-0">
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

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-1 text-sm font-semibold">Default form questions</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Jobs in this department will include these questions by default.
              </p>
              <FieldList fields={fields} onChange={setFields} />
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={() => onSave({ custom_fields: fields })}>
                  Save form
                </Button>
              </div>
            </div>
          </CardContent>
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
}

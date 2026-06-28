import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDepartments } from "@/hooks/useDepartments";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/departments")({
  component: AdminDepartments,
});

function AdminDepartments() {
  const qc = useQueryClient();
  const { data: departments = [], isLoading } = useDepartments({ includeInactive: true });
  const [newName, setNewName] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["departments"] });
  };

  const add = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("departments").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setNewName(""); toast.success("Department added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("departments").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("departments").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Renamed"); },
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
        <p className="text-sm text-muted-foreground">Manage which departments admins can assign to jobs.</p>
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

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : departments.length === 0 ? (
            <p className="p-6 text-muted-foreground">No departments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-32">Active</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Input
                        defaultValue={d.name}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== d.name) rename.mutate({ id: d.id, name: v });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={d.active}
                        onCheckedChange={(v) => toggle.mutate({ id: d.id, active: v })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { if (confirm(`Delete "${d.name}"?`)) del.mutate(d.id); }}
                      >
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

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOffices } from "@/hooks/useOffices";
import { Plus, Trash2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/offices")({
  component: AdminOffices,
});

function AdminOffices() {
  const qc = useQueryClient();
  const { data: offices = [], isLoading } = useOffices({ includeInactive: true });
  const [newName, setNewName] = useState("");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["offices"] });

  const add = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("offices").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setNewName(""); toast.success("Office added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("offices").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("offices").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Renamed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader
        icon={MapPin}
        eyebrow="Admin · Offices"
        title="Office locations"
        description="Manage office locations admins can pick when posting jobs."
      />

      <Card className="mb-6 mt-6">

        <CardContent className="flex gap-2 p-4">
          <Input
            placeholder="New office name (e.g. Dhaka — Engineering)"
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
          ) : offices.length === 0 ? (
            <p className="p-6 text-muted-foreground">No offices yet.</p>
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
                {offices.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Input
                        defaultValue={o.name}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== o.name) rename.mutate({ id: o.id, name: v });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={o.active} onCheckedChange={(v) => toggle.mutate({ id: o.id, active: v })} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete "${o.name}"?`)) del.mutate(o.id); }}>
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

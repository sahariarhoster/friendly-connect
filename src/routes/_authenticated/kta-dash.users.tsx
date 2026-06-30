import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Users as UsersIcon, Plus, KeyRound, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  listUsers,
  createUser,
  resetPassword,
  setUserRole,
  deleteUsers,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/kta-dash/users")({
  component: AdminUsers,
});

type Row = Awaited<ReturnType<typeof listUsers>>[number];

function AdminUsers() {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const reset = useServerFn(resetPassword);
  const setRole = useServerFn(setUserRole);
  const del = useServerFn(deleteUsers);

  const { user } = Route.useRouteContext();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [resetFor, setResetFor] = useState<Row | null>(null);
  const [newPass, setNewPass] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "applicant" as "admin" | "applicant" });

  const { data: users, isLoading } = useQuery({
    queryKey: ["kta-users"],
    queryFn: () => list(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["kta-users"] });

  const createMut = useMutation({
    mutationFn: (d: typeof form) => create({ data: d }),
    onSuccess: () => {
      refresh();
      setCreateOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "applicant" });
      toast.success("User created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMut = useMutation({
    mutationFn: (d: { user_id: string; password: string }) => reset({ data: d }),
    onSuccess: () => {
      setResetFor(null);
      setNewPass("");
      toast.success("Password reset");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: (d: { user_id: string; role: "admin" | "applicant" }) => setRole({ data: d }),
    onSuccess: () => {
      refresh();
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (ids: string[]) => del({ data: { ids } }),
    onSuccess: (r) => {
      refresh();
      setSelected(new Set());
      toast.success(`Deleted ${r.count} user(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = users ?? [];
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <PageHeader
        icon={UsersIcon}
        eyebrow="Admin · Users"
        title="User management"
        description="Create admins or applicants, reset passwords, change roles, and remove users."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> New user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Password * (min 8)</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div>
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "applicant" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applicant">Applicant</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button disabled={createMut.isPending} onClick={() => createMut.mutate(form)}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {selected.size > 0 && (
        <Card className="border-border/70">
          <CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="text-sm">{selected.size} selected</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={delMut.isPending}
                onClick={() => {
                  if (confirm(`Delete ${selected.size} user(s)? This cannot be undone.`)) {
                    delMut.mutate(Array.from(selected));
                  }
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Delete selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-border/70">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No users yet" description="Create your first user above." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10">
                    <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last sign-in</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const isAdmin = r.roles.includes("admin");
                  const isSelf = r.id === user.id;
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={selected.has(r.id)}
                          disabled={isSelf}
                          onCheckedChange={() => toggleOne(r.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                            {(r.full_name || r.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium">{r.full_name || "—"} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}</div>
                            <div className="text-xs text-muted-foreground">{r.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={isAdmin ? "admin" : "applicant"}
                          disabled={isSelf}
                          onValueChange={(v) => roleMut.mutate({ user_id: r.id, role: v as "admin" | "applicant" })}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applicant">Applicant</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Reset password" onClick={() => setResetFor(r)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          disabled={isSelf}
                          onClick={() => {
                            if (confirm(`Delete ${r.email}?`)) delMut.mutate([r.id]);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Reset password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">For <Badge variant="outline">{resetFor?.email}</Badge></div>
            <div>
              <Label>New password (min 8)</Label>
              <Input type="text" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetFor(null)}>Cancel</Button>
            <Button
              disabled={resetMut.isPending || newPass.length < 8}
              onClick={() => resetFor && resetMut.mutate({ user_id: resetFor.id, password: newPass })}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

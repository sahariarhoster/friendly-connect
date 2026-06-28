import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { POSITION_LABELS, type PositionType } from "@/lib/positions";
import { useDepartments } from "@/hooks/useDepartments";
import { Briefcase, MapPin, Clock, Search, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Open roles — Khatiana Job Portal" },
      { name: "description", content: "Browse open positions at Khatiana across all departments." },
      { property: "og:title", content: "Open roles — Khatiana" },
      { property: "og:description", content: "Browse open positions at Khatiana." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const [search, setSearch] = useState("");
  const [posType, setPosType] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const { data: departments = [] } = useDepartments();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["public-jobs"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, department, position_type, description, location, deadline, status, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (jobs ?? []).filter((j) => {
    const matchesSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesType = posType === "all" || j.position_type === posType;
    const matchesDept = dept === "all" || j.department === dept;
    return matchesSearch && matchesType && matchesDept;
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          icon={Briefcase}
          eyebrow="Careers at Khatiana"
          title="Find your next role"
          description="Browse open positions across all departments. Apply in minutes — no account required."
        />

        <Card className="border-border/70">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={posType} onValueChange={setPosType}>
              <SelectTrigger className="sm:w-56"><SelectValue placeholder="All positions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                {Object.entries(POSITION_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="sm:w-52"><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="space-y-3 p-6">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card><EmptyState icon={Search} title="No matching roles" description="Try clearing filters or check back soon — we post new roles often." /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((job) => (
              <Link
                key={job.id}
                to="/jobs/$jobId"
                params={{ jobId: job.id }}
                className="group block"
              >
                <Card className="h-full overflow-hidden border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="font-medium">
                        {POSITION_LABELS[job.position_type as PositionType]}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary">
                      {job.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      {job.department && (
                        <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.department}</span>
                      )}
                      {job.location && (
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                      )}
                      {job.deadline && (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(job.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      View role <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

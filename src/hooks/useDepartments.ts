import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Department = {
  id: string;
  name: string;
  active: boolean;
};

export function useDepartments(opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ["departments", opts.includeInactive ? "all" : "active"],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("departments").select("id, name, active").order("name");
      if (!opts.includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Department[];
    },
  });
}

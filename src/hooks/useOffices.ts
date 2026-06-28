import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Office = { id: string; name: string; active: boolean };

export function useOffices(opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ["offices", opts.includeInactive ? "all" : "active"],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("offices").select("id, name, active").order("name");
      if (!opts.includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Office[];
    },
  });
}

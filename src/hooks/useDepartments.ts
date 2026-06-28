import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CustomField } from "@/lib/positions";

export type Department = {
  id: string;
  name: string;
  active: boolean;
  custom_fields: CustomField[];
};

export function useDepartments(opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ["departments", opts.includeInactive ? "all" : "active"],
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("departments").select("id, name, active, custom_fields").order("name");
      if (!opts.includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((d) => ({
        ...d,
        custom_fields: (d.custom_fields ?? []) as CustomField[],
      })) as Department[];
    },
  });
}

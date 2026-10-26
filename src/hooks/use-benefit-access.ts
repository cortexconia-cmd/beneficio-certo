import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const FREE_BENEFIT_SLUGS = new Set(["bolsa-familia", "auxilio-gas", "bpc-loas"]);
export function isFreeBenefit(slug: string): boolean { return FREE_BENEFIT_SLUGS.has(slug); }

export function useBenefitAccess() {
  const { user, loading: authLoading } = useAuth();
  const access = useQuery({
    queryKey: ["benefit-access", user?.id],
    enabled: !!user?.id && !authLoading,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.from("access_grants")
        .select("access_scope,benefit_id,starts_at,expires_at,revoked_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      const now = Date.now();
      return data.filter(g => !g.revoked_at && Date.parse(g.starts_at) <= now && (!g.expires_at || Date.parse(g.expires_at) > now));
    },
  });
  const hasCatalog = !!user && !!access.data?.some(g => g.access_scope === "catalog");
  return {
    user, hasCatalog,
    checking: authLoading || (!!user && (access.isPending || access.isFetching)),
    error: access.error,
    canOpen: (slug: string, benefitId?: string) =>
      isFreeBenefit(slug) || (hasCatalog && !access.isError) ||
      (!!user && !!benefitId && !!access.data?.some(g => g.access_scope === "benefit" && g.benefit_id === benefitId)),
    refresh: access.refetch,
  };
}
